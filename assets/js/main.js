/* 泰州→坝上秋色 自驾路书 · V4 交互 */
(function () {
  // 行前清单：勾选状态本地记忆
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.check input'));
  var KEY = 'bashang-v3-checklist';
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    boxes.forEach(function (b, i) {
      if (saved[i]) { b.checked = true; b.closest('.check').classList.add('done'); }
    });
  } catch (e) {}
  boxes.forEach(function (b) {
    b.addEventListener('change', function () {
      b.closest('.check').classList.toggle('done', b.checked);
      try {
        localStorage.setItem(KEY, JSON.stringify(boxes.map(function (x) { return x.checked; })));
      } catch (e) {}
    });
  });

  // 吸顶导航滚动高亮
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var secs = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && secs.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) {
            l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id);
          });
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ================= 天气实时更新 =================
     V4 重排后 12 天与页面卡片一一对应：当天代表性地点 + 日期 */
  var WMO = {
    0:'晴',1:'大体晴',2:'局部多云',3:'阴',45:'雾',48:'雾凇',
    51:'小毛毛雨',53:'毛毛雨',55:'浓毛毛雨',
    61:'小雨',63:'中雨',65:'大雨',66:'冻雨',
    71:'小雪',73:'中雪',75:'大雪',77:'雪粒',
    80:'小阵雨',81:'阵雨',82:'强阵雨',85:'小阵雪',86:'阵雪',
    95:'雷阵雨',96:'雷暴伴冰雹',99:'强雷暴伴冰雹'
  };
  var ICONS = {
    0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',
    51:'🌦',53:'🌦',55:'🌦',61:'🌧',63:'🌧',65:'🌧',66:'🌧',
    71:'🌨',73:'🌨',75:'❄️',77:'🌨',
    80:'🌦',81:'🌧',82:'🌧',85:'🌨',86:'❄️',
    95:'⛈',96:'⛈',99:'⛈'
  };
  function beaufort(kmh) {
    var t = [5,11,19,28,38,49,61,74,88,102,117];
    for (var i = 0; i < t.length; i++) if (kmh <= t[i]) return i + 1;
    return 12;
  }
  var DAYS = [
    { lat:34.379, lon:118.345, date:'2026-09-25', at:'今晚·夜车北上' },
    { lat:39.303, lon:117.416, date:'2026-09-26', at:'全天·天津' },
    { lat:40.951, lon:117.963, date:'2026-09-27', at:'夜宿承德' },
    { lat:42.367, lon:117.481, date:'2026-09-28', at:'塞罕坝' },
    { lat:42.435, lon:117.533, date:'2026-09-29', at:'乌兰布统' },
    { lat:42.435, lon:117.533, date:'2026-09-30', at:'乌兰布统机动日' },
    { lat:43.242, lon:117.908, date:'2026-10-01', at:'热水塘温泉' },
    { lat:43.510, lon:117.600, date:'2026-10-02', at:'热阿线·黄岗梁' },
    { lat:42.188, lon:116.489, date:'2026-10-03', at:'多伦→张家口' },
    { lat:37.436, lon:116.357, date:'2026-10-04', at:'夜宿德州' },
    { lat:35.099, lon:117.166, date:'2026-10-05', at:'夜宿滕州' },
    { lat:32.455, lon:119.923, date:'2026-10-06', at:'回到泰州' }
  ];

  var rows = Array.prototype.slice.call(document.querySelectorAll('.row.wx'));
  var wxBtn = document.getElementById('wx-refresh');
  var wxNote = document.getElementById('wx-note');
  var inFlight = false;

  function fmt(d, i, at) {
    var code = d.weather_code[i], txt = WMO[code] || '—';
    var ico = ICONS[code] || '🌡';
    var tmin = Math.round(d.temperature_2m_min[i]);
    var tmax = Math.round(d.temperature_2m_max[i]);
    var pp = (d.precipitation_probability_max && d.precipitation_probability_max[i] != null)
      ? d.precipitation_probability_max[i] : null;
    var b = beaufort(d.wind_speed_10m_max[i]);
    var s = '<b>' + ico + ' ' + txt + '</b> · ' + tmin + '~' + tmax + '℃';
    if (pp !== null) s += ' · 降水概率 ' + pp + '%';
    s += ' · 风' + b + '级';
    if (b >= 6) s += '（大风）';
    s += '<br><span class="wx-at">' + at + ' · 实时预报</span>';
    return s;
  }

  function refresh(manual) {
    if (inFlight || !rows.length) return;
    inFlight = true;
    if (wxBtn) { wxBtn.disabled = true; wxBtn.textContent = '刷新中…'; }
    var lats = DAYS.map(function (d) { return d.lat; }).join(',');
    var lons = DAYS.map(function (d) { return d.lon; }).join(',');
    var url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=' + lats + '&longitude=' + lons +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max' +
      '&timezone=Asia%2FShanghai&forecast_days=16';
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      var ok = 0;
      DAYS.forEach(function (day, i) {
        var loc = Array.isArray(data) ? data[i] : data;
        if (!loc || !loc.daily) return;
        var idx = (loc.daily.time || []).indexOf(day.date);
        if (idx < 0) return;
        var v = rows[i] && rows[i].querySelector('.value');
        if (v) { v.innerHTML = fmt(loc.daily, idx, day.at); ok++; }
      });
      if (wxNote) {
        var now = new Date();
        var hh = ('0' + now.getHours()).slice(-2), mm = ('0' + now.getMinutes()).slice(-2);
        wxNote.textContent = '已更新 ' + hh + ':' + mm + ' · 覆盖 ' + ok + '/' + DAYS.length + ' 天' + (ok < DAYS.length ? '（其余保留快照）' : '');
      }
    }).catch(function () {
      if (wxNote) wxNote.textContent = manual
        ? '刷新失败，保留当前内容，可稍后再试'
        : '未取到最新预报，当前展示页面写入的快照';
    }).then(function () {
      inFlight = false;
      if (wxBtn) { wxBtn.disabled = false; wxBtn.textContent = '刷新天气'; }
    });
  }

  if (wxBtn) wxBtn.addEventListener('click', function () { refresh(true); });
  setTimeout(function () { refresh(false); }, 800);
})();
