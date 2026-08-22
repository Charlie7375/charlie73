/* 차트 공통 그림체 — 흰 바탕 FT · 검은 바탕 블룸버그 단말.
   생성: scripts/chart_theme.py · 이 파일이 그림체의 유일한 원본이다.

   ⚠ 이 파일은 **chart.umd.js 바로 뒤**에 실려야 한다.
     차트를 만드는 인라인 스크립트보다 앞이어야 생성자를 감쌀 수 있다.

   왜 생성자를 감싸나 — 두 번 틀리고 알아낸 것(2026-08-05)
     · beforeInit 에서 해석된 options 를 고쳤다 → 전 페이지 차트가 사라졌다
     · 다 그린 뒤 chart.options 를 고쳤다 → 아무것도 안 바뀌었다.
       Chart.js 4 의 chart.options 는 해석이 끝난 프록시라 update() 때 버려진다.
       게다가 프록시에 쓰다 내부가 꼬여 «Recursion detected» 로 마우스오버까지 죽었다.
     · 지금 — 페이지가 넘기는 «날것» 설정을 Chart 가 보기 전에 고친다.
       프록시가 아직 없으니 꼬일 것이 없다. 실패하면 원래 설정 그대로 넘긴다.

   손볼 때 여기만 고치면 된다. 고친 뒤엔 chart_theme.py 를 다시 돌려라(`?v=` 갱신). */
(function(){
'use strict';
var _C = window.Chart;
if (!_C || _C.__ct) return;          /* Chart.js 가 아직 없거나 이미 감쌌으면 그만 */

/* ⚠ 색은 «갈아 끼우지» 않는다. 색조(hue)를 그대로 두고 **밝기만** 올린다.
   처음엔 흰 바탕 FT · 검은 바탕 블룸버그로 팔레트를 통째로 바꿨는데,
   본문이 «신용융자(주황)», «파란 선», «붉은 점»처럼 **색을 말로 지칭한 곳이 209군데**였다.
   팔레트를 갈면 그 209군데가 전부 거짓말이 된다(실제로 주황 선이 청록이 됐다).
   → 주황은 주황으로, 파랑은 파랑으로 두고, 검은 배경에서만 밝게 띄운다.
     블룸버그 단말이 앰버·시안을 쓰는 이유도 «그 색이라서»가 아니라
     «검은 배경에서 뜨는 밝기라서»다. 우리는 밝기만 빌린다. */
function dark(){ return document.documentElement.classList.contains('theme-dark'); }

function _hsl(c){
  if (typeof c !== 'string') return null;
  var s = c.trim(), r, g, b, m;
  if (s.charAt(0) === '#') {
    if (s.length === 4) s = '#' + s[1]+s[1] + s[2]+s[2] + s[3]+s[3];
    if (s.length !== 7) return null;
    r = parseInt(s.substr(1,2),16); g = parseInt(s.substr(3,2),16); b = parseInt(s.substr(5,2),16);
  } else if ((m = s.match(/^rgba?\(([^)]+)\)$/i))) {
    var q = m[1].split(',');
    r = parseFloat(q[0]); g = parseFloat(q[1]); b = parseFloat(q[2]);
    if (q.length > 3 && parseFloat(q[3]) < .5) return null;   /* 반투명은 손대지 않는다 */
  } else return null;
  if (!isFinite(r) || !isFinite(g) || !isFinite(b)) return null;
  r/=255; g/=255; b/=255;
  var mx = Math.max(r,g,b), mn = Math.min(r,g,b), h = 0, sa = 0, l = (mx+mn)/2, d2 = mx-mn;
  if (d2) {
    sa = l > .5 ? d2/(2-mx-mn) : d2/(mx+mn);
    h = mx === r ? ((g-b)/d2 + (g<b?6:0)) : mx === g ? ((b-r)/d2 + 2) : ((r-g)/d2 + 4);
    h *= 60;
  }
  return [h, sa, l];
}
/* 검은 배경에서 뜨도록 밝기를 올린다. 색조는 그대로. */
function shade(c){
  if (!dark()) return c;                       /* 흰 바탕이면 페이지 색 그대로 */
  var v = _hsl(c);
  if (!v) return c;
  var h = v[0], s = Math.min(.92, Math.max(v[1], .55)), l = Math.max(v[2], .62);
  return 'hsl(' + Math.round(h) + ',' + Math.round(s*100) + '%,' + Math.round(l*100) + '%)';
}
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

/* ── 날것 설정 고치기 ─ Chart 가 보기 전에. 여러 번 돌려도 같은 결과가 되게 한다 ── */
function tweak(cfg){
  var o = cfg.options = cfg.options || {};
  o.plugins = o.plugins || {};
  o.plugins.legend = Object.assign({}, o.plugins.legend, {display:false});
  o.plugins.tooltip = Object.assign({}, o.plugins.tooltip, {
    enabled:true, mode:'index', intersect:false,
    backgroundColor: dark() ? 'rgba(14,17,22,.97)' : 'rgba(255,255,255,.97)',
    titleColor: ink(), bodyColor: ink(),
    borderColor: dark() ? 'rgba(255,255,255,.14)' : 'rgba(15,23,42,.12)',
    borderWidth:1, cornerRadius:10, padding:11,
    usePointStyle:true, boxWidth:8, boxHeight:8, boxPadding:6,
    titleFont:{size:12, weight:'600'}, bodyFont:{size:12.5}
  });
  o.interaction = {mode:'index', intersect:false};

  o.scales = o.scales || {};
  Object.keys(o.scales).forEach(function(k){
    var s = o.scales[k] = Object.assign({}, o.scales[k]);
    s.border = {display:false};                                  /* 축 테두리 제거 */
    s.grid = Object.assign({}, s.grid, {color:grid(), drawTicks:false, lineWidth:1});
    if (/^x/.test(k)) s.grid.display = false;                    /* 세로 격자 없음 */
    s.ticks = Object.assign({}, s.ticks, {color:dim(), padding:8, font:{size:11.5}});
    if (/^y/.test(k) && s.ticks.maxTicksLimit === undefined) s.ticks.maxTicksLimit = 5;
  });

  var bar0 = (cfg.type === 'bar');
  ((cfg.data && cfg.data.datasets) || []).forEach(function(d, i){
    /* 원래 색을 한 번만 보관한다. 테마를 오갈 때 이 값에서 다시 계산한다 */
    if (d.__c0 === undefined) d.__c0 = d.borderColor;
    if (d.__b0 === undefined) d.__b0 = d.backgroundColor;
    if (isBase(d)) { d.borderColor = base(); d.borderWidth = 1; d.pointRadius = 0; return; }
    d.borderColor = shade(d.__c0);              /* 색조 유지 · 어두울 때만 밝기 ↑ */
    if (typeof d.__b0 === 'string') d.backgroundColor = shade(d.__b0);
    if (bar0 || d.type === 'bar') {
      d.borderRadius = 4; d.borderSkipped = false;
    } else {
      d.borderWidth = 2; d.pointRadius = 0;
      d.pointHoverRadius = 4; d.pointHitRadius = 10;
      if (d.tension === undefined) d.tension = .28;
    }
  });
}

/* ── 생성자 감싸기 ── */
var LIVE = [];
function Wrapped(item, cfg){
  try { tweak(cfg); } catch(e) { /* 실패해도 원래 설정 그대로 만든다 */ }
  var c = new _C(item, cfg);
  try { LIVE.push({c:c, cfg:cfg}); } catch(e) {}
  return c;
}
Object.setPrototypeOf(Wrapped, _C);
Object.assign(Wrapped, _C);
Wrapped.prototype = _C.prototype;
Wrapped.__ct = 1;
window.Chart = Wrapped;

/* ① 선 끝에 마지막 값 ─ 축 눈금을 눈으로 세지 않게 한다 */
try{
_C.register({
  id: 'charttheme-endlabel',
  afterDatasetsDraw: function(ch){
    try{
      if ((ch.config.type || 'line') !== 'line') return;
      var cx = ch.ctx, area = ch.chartArea, put = [];
      (ch.data.datasets || []).forEach(function(d, i){
        if (!ch.isDatasetVisible(i) || isBase(d)) return;
        var meta = ch.getDatasetMeta(i);
        if (!meta || !meta.data || !meta.data.length) return;
        /* ⚠ meta.data[j] 는 **값이 null 이어도 좌표가 유한하다.** 그래서 예전 코드는
           끝이 빈 계열(예: 2000년에 끝나는 LTGOVTBD)의 라벨을 축 오른쪽 바닥에 찍었다.
           숫자는 6.23 인데 위치는 0 근처였다(2026-08-21에 실제로 그랬다).
           → 좌표가 아니라 **자료**가 있는 마지막 칸을 먼저 찾는다. */
        var li = -1;
        for (var j = d.data.length - 1; j >= 0; j--) { if (num(d.data[j]) !== null) { li = j; break; } }
        var el = (li >= 0) ? meta.data[li] : null;
        if (el && !(isFinite(el.x) && isFinite(el.y))) el = null;
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
});
}catch(e){}

/* ② 차트 위 «지금 값» 타일 ─ 큰 숫자로 한눈에. 범례 노릇도 겸한다. */
function tiles(ch){
  try{
    var box = ch.canvas.parentNode;
    if (!box) return;
    var prev = box.previousElementSibling;
    if (prev && prev.classList.contains('ct-now')) prev.remove();   /* 테마 바뀌면 다시 */

    var items = [];
    (ch.data.datasets || []).forEach(function(d, i){
      /* ⚠ 숨긴 계열을 여기서 빼면 «다시 켤 방법»이 사라진다.
         남겨 두고 흐리게만 그린다 (2026-08-21 상수님 «클릭해서 지우고 나타나게»). */
      if (isBase(d) || !d.label) return;
      var v = lastOf(d);
      if (v === null) return;
      /* ⚠ 이전 값은 «마지막 유효칸 앞»에서 찾는다. length-2 에서 시작하면 끝이 빈 계열은
         널을 건너뛰다 자기 자신에 닿아 변화가 늘 0 이 된다(«– 0.00»). */
      var li = -1;
      for (var j = d.data.length - 1; j >= 0; j--) { if (num(d.data[j]) !== null) { li = j; break; } }
      var p = null;
      for (var j = li - 1; j >= 0; j--) { p = num(d.data[j]); if (p !== null) break; }
      items.push({l: d.label, v: v, p: p, i: i, on: ch.isDatasetVisible(i),
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
        '<div class="ct-tile" role="button" tabindex="0" data-i="' + it.i + '"' +
        ' aria-pressed="' + (it.on ? 'true' : 'false') + '"' +
        ' title="눌러서 이 계열을 켜고 끕니다"' +
        ' style="cursor:pointer;user-select:none;border-radius:8px;padding:2px 6px;margin:-2px -6px;' +
        'transition:opacity .15s;opacity:' + (it.on ? '1' : '.34') + '">' +
        '<div style="display:flex;align-items:center;gap:6px;font-size:12px;' +
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
    /* 켜고 끄기. 그림을 먼저 바꾸고 타일 모양은 그다음이다 —
       앞줄이 실패해도 그림은 바뀌어야 한다(기간 전환에서 배운 것과 같은 규칙). */
    /* ⚠ 여기서 바깥의 ch 를 붙잡으면 안 된다 (2026-08-21).
       테마 토글이나 기간 전환이 차트를 부수고 다시 만들면 클로저는 죽은 객체를 들고 있게 되고,
       setDatasetVisibility 는 조용히 아무 일도 하지 않는다.
       화면의 흐리기만 바뀌고 선은 그대로여서 «눌러도 안 된다»로 보인다.
       → 캔버스 id 만 기억하고 **누를 때마다 살아 있는 차트를 다시 찾는다.** */
    var cid = ch.canvas && ch.canvas.id;
    function live(){
      try { return (window.Chart && Chart.getChart) ? Chart.getChart(cid) : null; }
      catch(e){ return null; }
    }
    function toggle(el){
      var c = live(); if (!c) return;
      var i = parseInt(el.getAttribute('data-i'), 10);
      if (isNaN(i)) return;
      var on = c.isDatasetVisible(i);
      /* 마지막 하나까지 끄면 빈 차트가 된다. 그건 고장으로 보인다. */
      var n = 0;
      c.data.datasets.forEach(function(_, k){ if (c.isDatasetVisible(k)) n++; });
      if (on && n <= 1) return;
      try { c.setDatasetVisibility(i, !on); c.update(); } catch(e){}
      try {
        el.style.opacity = on ? '.34' : '1';
        el.setAttribute('aria-pressed', on ? 'false' : 'true');
      } catch(e){}
    }
    row.querySelectorAll('.ct-tile').forEach(function(el){
      el.addEventListener('click', function(){ toggle(el); });
      el.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(el); }
      });
    });
    box.parentNode.insertBefore(row, box);
  }catch(e){}
}

function paint(){ LIVE.forEach(function(e){ tiles(e.c); }); }

/* 테마를 바꾸면 팔레트가 통째로 갈린다.
   만들어진 차트의 옵션은 못 고친다(프록시) — 그래서 **다시 만든다.**
   날것 설정을 들고 있으니 가능하다. */
var t0 = null;
function repaint(){
  /* ⚠ 애니메이션을 끄고 다시 만든다. 켜 두면 차트 5장을 한꺼번에 새로 그리느라
     테마 버튼 한 번에 화면이 수 초 멎는다(2026-08-05 실측). 되돌려 놓는 것도 잊지 않는다. */
  LIVE.forEach(function(e){
    try{
      var cv = e.c.canvas;
      var keep = e.cfg.options ? e.cfg.options.animation : undefined;
      e.c.destroy();
      tweak(e.cfg);
      e.cfg.options.animation = false;
      e.c = new _C(cv, e.cfg);
      e.cfg.options.animation = keep;      /* 다음 생성 때는 원래대로 */
    }catch(err){}
  });
  paint();
}
try{
  new MutationObserver(function(){
    clearTimeout(t0); t0 = setTimeout(repaint, 60);
  }).observe(document.documentElement, {attributes:true, attributeFilter:['class']});
}catch(e){}

if (document.readyState === 'complete') setTimeout(paint, 120);
else window.addEventListener('load', function(){ setTimeout(paint, 120); });
})();

/* ── 바닥 7단계 표기 플러그인 (2026-08-21 상수님 «실제 차트에도 7단계를 표기해줘») ──
   차트 위에 ①~⑦이 «언제 켜졌는지»를 점과 번호로 직접 찍는다.

   왜 여기인가 — 이 파일은 Chart.js 다음, 차트를 만드는 렌더러 **앞**에 실린다.
   생성기가 내보내는 <script> 는 Chart.js 보다 먼저라 거기서는 Chart.register 를 못 부른다.
   자료는 생성기가 window.__B7MARK[캔버스id] 에 담아 두고, 그리기는 여기서 한다.

   ⚠ 자료가 없으면 아무것도 하지 않는다. 7단계가 없는 차트 130여 장에 영향이 없다. */
try{
if (window.Chart && !window.__B7PLUG) {
  window.__B7PLUG = 1;
  Chart.register({
    id: 'b7marks',
    afterDatasetsDraw: function(ch){
      var M = (window.__B7MARK||{})[ch.canvas && ch.canvas.id];
      if (!M || !M.length) return;
      var g = ch.ctx, xa = ch.scales.x, ya = ch.scales.y;
      if (!xa || !ya) return;
      var dark = document.documentElement.className.indexOf('dark') >= 0;
      var on  = dark ? '#4da3ff' : '#0071e3';
      var ink = dark ? '#0b0b0d' : '#ffffff';
      g.save();
      M.forEach(function(m){
        var x = xa.getPixelForValue(m.i), y = ya.getPixelForValue(m.y);
        if (!isFinite(x) || !isFinite(y)) return;
        var top = y - 26;
        g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x, top + 11);
        g.strokeStyle = on; g.lineWidth = 1.2; g.globalAlpha = .55; g.stroke();
        g.globalAlpha = 1;
        g.beginPath(); g.arc(x, top, 10, 0, Math.PI*2);
        g.fillStyle = on; g.fill();
        g.lineWidth = 2; g.strokeStyle = ink; g.stroke();
        g.fillStyle = ink; g.font = '700 12px system-ui, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(m.s), x, top + 0.5);
      });
      g.restore();
    }
  });
}
}catch(e){}
