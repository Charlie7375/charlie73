/* 차트 공통 그림체 — 흰 바탕 FT · 검은 바탕 블룸버그 단말.
   생성: scripts/chart_theme.py · 이 파일이 그림체의 유일한 원본이다.

   ⚠ 반드시 «차트가 다 만들어진 뒤에» 돈다. 생성 과정에 끼어들지 않는다.
     끼어들었다가 전 페이지 차트를 날린 적이 있다(2026-08-05).
     여기서 예외가 나도 차트는 이미 화면에 있다.

   손볼 때 여기만 고치면 된다 — 페이지 재생성은 필요 없다.
   다만 고친 뒤엔 chart_theme.py 를 다시 돌려야 `?v=` 해시가 갱신된다(캐시). */
(function(){
'use strict';

/* 한 팔레트로 두 배경을 못 덮는다.
   앰버 #FFA726 은 흰 배경 대비 1.94 — 형광펜을 칠한 꼴이 된다. */
var FT  = ['#1161c4','#d21f3c','#0D7680','#B4884D','#7c7a73'];
var BLM = ['#FFA726','#4DD0E1','#66BB6A','#EF5350','#9AA3AD'];

function dark(){ return document.documentElement.classList.contains('theme-dark'); }
function pal(){  return dark() ? BLM : FT; }
function grid(){ return dark() ? 'rgba(255,255,255,.075)' : 'rgba(15,23,42,.07)'; }
function dim(){  return dark() ? '#8B949E' : '#5b6470'; }
function ink(){  return dark() ? '#E8E6E1' : '#0f172a'; }
function surf(){ return dark() ? '#0E1116' : '#ffffff'; }
function up(){   return dark() ? '#EF5350' : '#d21f3c'; }
function dn(){   return dark() ? '#4DD0E1' : '#1161c4'; }
function base(){ return dark() ? 'rgba(255,255,255,.22)' : 'rgba(15,23,42,.20)'; }

/* 소수 자리 — 값 크기에 맞춘다. 지수 2,900 에 소수 둘은 군더더기다. */
function nfmt(v){
  var a = Math.abs(v);
  if (a >= 1000) return v.toLocaleString('ko-KR', {maximumFractionDigits:0});
  if (a >= 100)  return v.toFixed(0);
  if (a >= 10)   return v.toFixed(1);
  return v.toFixed(2);
}
function num(q){
  if (typeof q === 'number') return q;
  if (q && typeof q.y === 'number') return q.y;
  return null;
}
function lastOf(d){
  for (var i = d.data.length - 1; i >= 0; i--) { var v = num(d.data[i]); if (v !== null) return v; }
  return null;
}
/* 기준선(과열 110·과매도 90 처럼 값이 안 변하는 점선)인가.
   데이터가 아니라 눈금이므로 색을 가질 이유가 없다. */
function isBase(d){
  if (!d.borderDash || !d.borderDash.length) return false;
  var v = [], i;
  for (i = 0; i < d.data.length; i++) { var x = num(d.data[i]); if (x !== null) v.push(x); }
  if (v.length < 3) return false;
  for (i = 1; i < v.length; i++) if (v[i] !== v[0]) return false;
  return true;
}

/* ① 선 끝에 마지막 값 ─ 축 눈금을 눈으로 세지 않게 한다 */
var endlabel = {
  id: 'charttheme-endlabel',
  afterDatasetsDraw: function(ch){
    try{
      if ((ch.config.type || 'line') !== 'line') return;
      var cx = ch.ctx, area = ch.chartArea, put = [];
      (ch.data.datasets || []).forEach(function(d, i){
        if (!ch.isDatasetVisible(i) || isBase(d)) return;
        var meta = ch.getDatasetMeta(i);
        if (!meta || !meta.data || !meta.data.length) return;
        var el = null;
        for (var j = meta.data.length - 1; j >= 0; j--) {
          var p = meta.data[j];
          if (p && isFinite(p.x) && isFinite(p.y)) { el = p; break; }
        }
        var v = lastOf(d);
        if (!el || v === null) return;
        put.push({y: el.y, x: el.x, v: v,
                  c: (typeof d.borderColor === 'string' ? d.borderColor : dim())});
      });
      if (!put.length || put.length > 4) return;   /* 다섯 개부터는 그게 더 안 읽힌다 */
      put.sort(function(a,b){ return a.y - b.y; });
      for (var k = 1; k < put.length; k++)
        if (put[k].y - put[k-1].y < 15) put[k].y = put[k-1].y + 15;

      cx.save();
      cx.font = '600 12px Inter,"Noto Sans KR",-apple-system,sans-serif';
      cx.textBaseline = 'middle';
      put.forEach(function(p){
        var t = nfmt(p.v), w = cx.measureText(t).width;
        var x = Math.min(p.x + 9, area.right - w - 5);
        cx.beginPath(); cx.arc(p.x, p.y, 3, 0, 6.284);
        cx.fillStyle = p.c; cx.fill();
        cx.fillStyle = surf(); cx.globalAlpha = .88;
        cx.fillRect(x - 3, p.y - 8, w + 6, 16);
        cx.globalAlpha = 1;
        cx.fillStyle = p.c; cx.fillText(t, x, p.y);
      });
      cx.restore();
    }catch(e){}
  }
};

/* ② 차트 위 «지금 값» 타일 ─ 큰 숫자로 한눈에. 범례 노릇도 겸한다. */
function tiles(ch){
  try{
    var box = ch.canvas.parentNode;
    if (!box) return;
    var prev = box.previousElementSibling;
    if (prev && prev.classList.contains('ct-now')) prev.remove();  /* 테마 바뀌면 다시 */

    var items = [];
    (ch.data.datasets || []).forEach(function(d, i){
      if (!ch.isDatasetVisible(i) || isBase(d) || !d.label) return;
      var v = lastOf(d);
      if (v === null) return;
      var p = null;
      for (var j = d.data.length - 2; j >= 0; j--) { p = num(d.data[j]); if (p !== null) break; }
      items.push({l: d.label, v: v, p: p,
                  c: (typeof d.borderColor === 'string' ? d.borderColor : dim())});
    });
    if (!items.length || items.length > 4) return;

    var row = document.createElement('div');
    row.className = 'ct-now';
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:28px;margin:0 0 14px;' +
                        'padding:0 2px;align-items:flex-end';
    items.forEach(function(it){
      var d = (it.p === null) ? null : it.v - it.p;
      var mark = d === null ? '' : (d > 0 ? '▲ ' : (d < 0 ? '▼ ' : '– '));
      var col  = d === null ? dim() : (d > 0 ? up() : (d < 0 ? dn() : dim()));
      row.innerHTML +=
        '<div><div style="display:flex;align-items:center;gap:6px;font-size:12px;' +
        'color:' + dim() + ';letter-spacing:-.01em;margin-bottom:3px">' +
        '<span style="width:9px;height:9px;border-radius:2px;background:' + it.c + '"></span>' +
        it.l + '</div>' +
        '<div style="font-size:27px;font-weight:700;letter-spacing:-.03em;' +
        'font-variant-numeric:tabular-nums;line-height:1.12;color:' + ink() + '">' +
        nfmt(it.v) + '</div>' +
        (d === null ? '' :
          '<div style="font-size:12px;font-weight:600;color:' + col + ';' +
          'font-variant-numeric:tabular-nums;margin-top:1px">' +
          mark + nfmt(Math.abs(d)) + '</div>') +
        '</div>';
    });
    box.parentNode.insertBefore(row, box);
  }catch(e){}
}

/* ③ 축·격자·선·툴팁 ─ 걷어내는 쪽으로만 */
function restyle(ch){
  var P = pal(), o = ch.options;
  o.plugins = o.plugins || {};
  o.plugins.legend = o.plugins.legend || {};
  o.plugins.legend.display = false;              /* 위 타일이 범례 노릇을 한다 */

  var T = o.plugins.tooltip = o.plugins.tooltip || {};
  T.enabled = true;
  T.mode = 'index'; T.intersect = false;
  T.backgroundColor = dark() ? 'rgba(14,17,22,.97)' : 'rgba(255,255,255,.97)';
  T.titleColor = ink(); T.bodyColor = ink();
  T.borderColor = dark() ? 'rgba(255,255,255,.14)' : 'rgba(15,23,42,.12)';
  T.borderWidth = 1; T.cornerRadius = 10; T.padding = 11;
  T.usePointStyle = true; T.boxWidth = 8; T.boxHeight = 8; T.boxPadding = 6;
  T.titleFont = {size:12, weight:'600'}; T.bodyFont = {size:12.5};
  o.interaction = {mode:'index', intersect:false};

  Object.keys(o.scales || {}).forEach(function(k){
    var s = o.scales[k];
    s.border = {display:false};                                  /* 축 테두리 제거 */
    s.grid = s.grid || {};
    s.grid.color = grid(); s.grid.drawTicks = false; s.grid.lineWidth = 1;
    if (/^x/.test(k) || s.axis === 'x') s.grid.display = false;   /* 세로 격자 없음 */
    s.ticks = s.ticks || {};
    s.ticks.color = dim(); s.ticks.padding = 8; s.ticks.font = {size:11.5};
    if (/^y/.test(k) || s.axis === 'y') s.ticks.maxTicksLimit = 5;
  });

  (ch.data.datasets || []).forEach(function(d, i){
    if (isBase(d)) { d.borderColor = base(); d.borderWidth = 1; d.pointRadius = 0; return; }
    if (d.__slot === undefined) d.__slot = i;     /* 색은 계열에 붙는다. 순서가 아니라 */
    if (typeof d.borderColor === 'string') d.borderColor = P[d.__slot % P.length];
    var bar = (d.type === 'bar') || (ch.config.type === 'bar');
    if (bar) {
      if (typeof d.backgroundColor === 'string') d.backgroundColor = P[d.__slot % P.length];
      d.borderRadius = 4; d.borderSkipped = false;
    } else {
      d.borderWidth = 2; d.pointRadius = 0;
      d.pointHoverRadius = 4; d.pointHitRadius = 10;
      if (d.tension === undefined) d.tension = .28;
    }
  });
}

function run(){
  if (!window.Chart) return;
  try { Chart.register(endlabel); } catch(e){}
  document.querySelectorAll('canvas').forEach(function(cv){
    var ch;
    try { ch = Chart.getChart(cv); } catch(e){ return; }
    if (!ch) return;
    try { restyle(ch); ch.update('none'); } catch(e){}
    try { tiles(ch); } catch(e){}
  });
}

/* 테마 버튼을 누르면 팔레트가 통째로 갈린다 — 다시 칠한다 */
try{
  new MutationObserver(function(){ setTimeout(run, 40); })
    .observe(document.documentElement, {attributes:true, attributeFilter:['class']});
}catch(e){}

if (document.readyState === 'complete') setTimeout(run, 150);
else window.addEventListener('load', function(){ setTimeout(run, 150); });
})();
