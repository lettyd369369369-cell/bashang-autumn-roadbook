/* 泰州→坝上秋色 13天自驾路书 · V3 交互 */
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
})();
