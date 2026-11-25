(function(){
'use strict';
/* Campaign settings: paste the ActBlue link and the Google Form endpoints here once they exist. */
var CONFIG = {
  actblue: '',          // e.g. https://secure.actblue.com/donate/gio-valencia  (?amount= is added)
  forms: { join: '', news: '', volunteer: '', survey: '' },  // Google Forms formResponse URLs
  site: 'https://gioforboston.com'
};

var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
gsap.registerPlugin(ScrollTrigger);
function $(s, r){ return (r || document).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
var html = document.documentElement;
var T = window.GIO_T || function(k, fb){ return fb; };

/* smooth scroll */
var lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(function(a){
  a.addEventListener('click', function(e){
    var id = a.getAttribute('href'); if (id.length < 2) return;
    var el = $(id); if (!el) return;
    e.preventDefault();
    var y = id === '#main' || id === '#top' ? 0 : -60;
    if (lenis) lenis.scrollTo(el, { offset: y }); else el.scrollIntoView({ behavior: 'smooth' });
  });
});

/* header hides on scroll down */
var top = $('#top'), lastY = 0;
addEventListener('scroll', function(){
  var y = scrollY;
  if (Math.abs(y - lastY) > 6) { top.classList.toggle('hide', y > 500 && y > lastY && !document.body.classList.contains('modal-open')); lastY = y; }
}, { passive: true });

/* reveal on scroll */
var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
$$('.rv').forEach(function(el){ io.observe(el); });

/* wide photo opens to full bleed */
if (!reduce) {
  gsap.fromTo('#wideFrame', { clipPath: 'inset(8% 8% 8% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
    scrollTrigger: { trigger: '#wideFrame', start: 'top 85%', end: 'top top', scrub: true } });
  gsap.fromTo('#wideFrame img', { yPercent: -8, scale: 1.1 }, { yPercent: 6, scale: 1, ease: 'none',
    scrollTrigger: { trigger: '#wideFrame', start: 'top bottom', end: 'bottom top', scrub: true } });
}

/* ---------- motion: subtle depth on the hero, cards and About photos ---------- */
if (!reduce) {
  // hero: photo drifts and zooms slowly, copy lifts a little faster
  gsap.to('.hero-photo img', { yPercent: 12, scale: 1.12, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-panel', { y: -70, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // cards: photo wipes up from the bottom, one after another, then drifts inside its frame
  gsap.set('.pillar', { opacity: 0, y: 60 });
  gsap.set('.pillar-img', { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set('.pillar-img img', { scale: 1.25 });
  ScrollTrigger.batch('.pillar', { start: 'top 85%', once: true, onEnter: function(els){
    var imgs = els.map(function(e){ return e.querySelector('.pillar-img'); });
    gsap.timeline()
      .to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out' }, 0)
      .to(imgs, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, stagger: 0.12, ease: 'expo.inOut' }, 0.1)
      .to(imgs.map(function(i){ return i.querySelector('img'); }), { scale: 1.08, duration: 1.6, stagger: 0.12, ease: 'power3.out' }, 0.1);
  } });
  $$('.pillar-img').forEach(function(box){
    gsap.fromTo(box.querySelector('img'), { yPercent: -5 }, { yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // about: the two photos move at different speeds
  gsap.fromTo('.ap-main', { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.ap-small', { y: 110 }, { y: -70, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.about-photos', { opacity: 0, x: -40, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.about', start: 'top 75%' } });
}

/* ---------- dialogs ---------- */
var openModal = null, lastFocus = null;
function show(name){
  var m = $('#m-' + name); if (!m) return;
  if (openModal) hide(true);
  lastFocus = lastFocus || document.activeElement;
  m.hidden = false; openModal = m;
  document.body.classList.add('modal-open'); if (lenis) lenis.stop();
  var note = $('.modal-note', m); if (note) note.hidden = true;
  var f = $('input:not([type=checkbox]), .amounts button, button', m.querySelector('.modal-box form') || m);
  setTimeout(function(){ (f || $('.x', m)).focus(); }, 30);
}
function hide(swap){
  if (!openModal) return;
  openModal.hidden = true; openModal = null;
  if (swap) return;
  document.body.classList.remove('modal-open'); if (lenis) lenis.start();
  if (lastFocus && lastFocus.focus) lastFocus.focus(); lastFocus = null;
}
document.addEventListener('click', function(e){
  var o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); show(o.dataset.open); return; }
  if (e.target.closest('[data-close]')) hide();
});
addEventListener('keydown', function(e){
  if (!openModal) return;
  if (e.key === 'Escape') hide();
  if (e.key === 'Tab') {  // keep focus inside the dialog
    var f = $$('button, input, select, textarea, a[href]', openModal).filter(function(x){ return x.offsetParent; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});

/* donate amounts: go to ActBlue with the amount, or say giving opens at launch */
document.addEventListener('click', function(e){
  var b = e.target.closest('.amounts button'); if (!b) return;
  if (CONFIG.actblue) {
    var a = b.dataset.amt;
    window.open(CONFIG.actblue + (a ? (CONFIG.actblue.indexOf('?') < 0 ? '?' : '&') + 'amount=' + a : ''), '_blank', 'noopener');
    return;
  }
  if (!$('#m-donate').hidden) { $('#m-donate .modal-note').hidden = false; return; }
  show('donate'); $('#m-donate .modal-note').hidden = false;
});

/* ---------- forms (mockup: answers go to Google Forms once CONFIG.forms is filled) ---------- */
function okEmail(v){ return /^\S+@\S+\.\S+$/.test(v.trim()); }
function send(kind, data){
  var url = CONFIG.forms[kind]; if (!url) return;
  var body = new URLSearchParams(); Object.keys(data).forEach(function(k){ body.append(k, data[k]); });
  fetch(url, { method: 'POST', mode: 'no-cors', body: body }).catch(function(){});
}
function collect(f){
  var d = {};
  $$('input, select, textarea', f).forEach(function(i){
    if (!i.name) return;
    if (i.type === 'checkbox') { if (i.checked) d[i.name] = (d[i.name] ? d[i.name] + ', ' : '') + i.value; }
    else d[i.name] = i.value.trim();
  });
  return d;
}
function err(f, on){ var p = $('.form-err', f); if (p) p.hidden = !on; }

$('#heroForm').addEventListener('submit', function(e){
  e.preventDefault(); var f = e.target;
  if (!okEmail(f.email.value)) { err(f, true); f.email.focus(); return; }
  var d = collect(f); err(f, false); send('join', d);
  var wantsGive = f.querySelector('input[value=donate]').checked;
  var wantsVol = f.querySelector('input[value=volunteer]').checked;
  f.reset(); f.querySelector('input[value=news]').checked = true;
  if (wantsVol) { show('volunteer'); var v = $('#m-volunteer form'); v.email.value = d.email || ''; if (d.name) v.name.value = d.name; }
  else if (wantsGive) show('donate');
  else show('thanks');
});
$$('.mform').forEach(function(f){
  f.addEventListener('submit', function(e){
    e.preventDefault();
    if (!okEmail(f.email.value)) { err(f, true); f.email.focus(); return; }
    err(f, false); send(f.dataset.kind, collect(f)); f.reset(); show('thanks');
  });
});
$('#surveyForm').addEventListener('submit', function(e){
  e.preventDefault(); var f = e.target, d = collect(f);
  if (!d.pri && !d.other) { err(f, true); return; }
  if (d.email && !okEmail(d.email)) { f.email.focus(); return; }
  err(f, false); send('survey', d); f.reset(); show('thanks');
});
/* survey: at most three */
$$('#surveyForm input[name=pri]').forEach(function(c){
  c.addEventListener('change', function(){
    var on = $$('#surveyForm input[name=pri]:checked');
    if (on.length > 3) c.checked = false;
  });
});

/* share with a friend: opens the visitor's own email with the message written */
$('#shareForm').addEventListener('submit', function(e){
  e.preventDefault(); var f = e.target;
  var to = f.to.value.split(/[\s,;]+/).filter(okEmail).join(',');
  var from = f.from.value.trim();
  var subj = T('mailSubj', 'Check out Gio Valencia for Boston City Council');
  var body = (from ? T('mailHi', 'Hi! {name} thinks you should check out Gio Valencia, running for Boston City Council At-Large.').replace('{name}', from)
                   : T('mailHi2', 'Hi! Check out Gio Valencia, running for Boston City Council At-Large.')) + '\n\n' + CONFIG.site;
  location.href = 'mailto:?bcc=' + encodeURIComponent(to) + '&subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
});
$('#copyLink').addEventListener('click', function(){
  var done = function(){ $('#copied').hidden = false; setTimeout(function(){ $('#copied').hidden = true; }, 2500); };
  if (navigator.clipboard) navigator.clipboard.writeText(CONFIG.site).then(done, done); else done();
});

/* ---------- loading screen: the sign draws itself, then the donate pop-up ---------- */
var loader = $('#loader'), sign = $('.sign');
scrollTo(0, 0);
if (lenis) lenis.stop();
function block(e){ if (html.classList.contains('loading')) e.preventDefault(); }
['wheel', 'touchmove'].forEach(function(t){ addEventListener(t, block, { passive: false }); });

function popup(){
  /* review mode: shows on every load. For launch, set ONCE_PER_VISIT = true. */
  var ONCE_PER_VISIT = false, seen = false;
  if (ONCE_PER_VISIT) { try { seen = sessionStorage.getItem('gioPop') === '1'; sessionStorage.setItem('gioPop', '1'); } catch (e) {} }
  if (!seen && !openModal) show('donate');
}
function start(){
  html.classList.remove('loading');
  scrollTo(0, 0); if (lenis) { lenis.scrollTo(0, { immediate: true, force: true }); lenis.start(); }
  ScrollTrigger.refresh();
  setTimeout(popup, reduce ? 300 : 1500);
}
function box(a, b){ var r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect(); return { left: r1.left, top: Math.min(r1.top, r2.top), width: r2.right - r1.left, height: Math.max(r1.bottom, r2.bottom) - Math.min(r1.top, r2.top) }; }
function liftPhone(){
  gsap.timeline({ onComplete: function(){ loader.remove(); } })
    .to('.sign-art, #signCursor', { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0)
    .to(sign, { y: -40, duration: 0.5, ease: 'power2.in' }, 0.1)
    .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.35)
    .to(sign, { y: -innerHeight * 0.6, opacity: 0, duration: 1.0, ease: 'expo.inOut' }, 0.4)
    .add(start, 0.75);
}
function lift(){
  if (innerWidth <= 700 || reduce) return liftPhone();
  var brand = $('.brand'), from = box($('.sign-vote'), $('.sign-name'));
  gsap.set(brand, { opacity: 0 });
  var to = box($('.brand-vote'), $('.brand-name'));
  var fly = $('.sign-top').cloneNode(true);   // the sign's name flies into the header logo
  fly.className = 'sign-top sign-fly';
  fly.style.cssText = 'left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;height:' + from.height + 'px;justify-content:flex-start;color:#1d3c95';
  $$('span', fly).forEach(function(s){ s.style.opacity = 1; });
  document.body.appendChild(fly);
  gsap.set('.sign-top', { opacity: 0 });
  gsap.timeline({ onComplete: function(){ loader.remove(); fly.remove(); } })
    .to('.sign-art, .sign-sub, .sign-frame, #signCursor', { opacity: 0, y: 10, duration: 0.45, ease: 'power2.in' }, 0)
    .to(sign, { scale: 1.03, opacity: 0, duration: 0.9, ease: 'power3.in' }, 0.15)
    .to(fly, { x: to.left - from.left, y: to.top - from.top, scale: to.width / from.width, duration: 1.25, ease: 'expo.inOut' }, 0.2)
    .to(loader, { opacity: 0, duration: 1, ease: 'power2.inOut' }, 0.55)
    .add(start, 0.75)
    .to(brand, { opacity: 1, duration: 0.3 }, 1.35)
    .to(fly, { opacity: 0, duration: 0.25 }, 1.4);
}
var heroImg = $('.hero-photo img');
function ready(){ return heroImg.complete && (!document.fonts || document.fonts.status === 'loaded'); }

if (reduce) { setTimeout(lift, 600); } else {
  var groups = gsap.utils.toArray('#signArt .la').sort(function(a, b){ return a.dataset.o - b.dataset.o; });
  var ground = groups.shift(), art = $('#signArt svg'), cursor = $('#signCursor');
  var T0 = 1.6, STEP = 0.2, DRAW = T0 + groups.length * STEP;
  var tl = gsap.timeline({ delay: 0.2, onComplete: function wait(){ if (ready()) setTimeout(lift, 400); else setTimeout(wait, 150); } });
  tl.fromTo(sign, { y: 50, opacity: 0, rotateX: 8, transformPerspective: 1200 }, { y: 0, opacity: 1, rotateX: 0, duration: 1.1, ease: 'expo.out' })
    .to('.f1 rect', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.2)
    .to('.f2 rect', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.35)
    .fromTo('.sign-vote', { opacity: 1, clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.45, ease: 'power2.inOut' }, 0.6)
    .fromTo('.sign-name', { opacity: 1, clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut' }, 0.8)
    .fromTo('.sign-sub', { y: 16, opacity: 0, letterSpacing: '.2em' }, { y: 0, opacity: 1, letterSpacing: '.05em', duration: 0.8, ease: 'power3.out' }, 1.3);
  var gl = $('[pathLength]', ground), pen = { t: 0 };
  var phone = innerWidth <= 700, S = 2.4, wrap = $('#signArt'), baseW, baseH;
  if (phone) {
    baseW = wrap.clientWidth; baseH = art.getBoundingClientRect().height;
    wrap.style.overflow = 'hidden'; wrap.style.height = baseH * S + 'px';
    gsap.set(art, { scale: S, transformOrigin: '0 0', x: 0 });
    tl.to(wrap, { height: baseH, duration: 1.1, ease: 'power3.inOut' }, DRAW + 0.1)
      .to(art, { scale: 1, x: 0, duration: 1.1, ease: 'power3.inOut' }, DRAW + 0.1);
  }
  function placePen(){
    if (phone) { var pl = (20 + 1600 * pen.t) * (baseW / 1640) * S; gsap.set(art, { x: Math.max(baseW - baseW * S, Math.min(0, baseW / 2 - pl)) }); }
    var sr = sign.getBoundingClientRect(), ar = art.getBoundingClientRect(), k = ar.width / 1640;
    gsap.set(cursor, { left: ar.left - sr.left + (20 + 1600 * pen.t) * k, top: ar.top - sr.top + 330 * k });
  }
  tl.set(cursor, { opacity: 1 }, T0 - 0.2)
    .to(pen, { t: 1, duration: DRAW - T0 + 0.4, ease: 'none', onUpdate: function(){ placePen(); gl.style.strokeDashoffset = 1 - pen.t; } }, T0 - 0.2)
    .to(cursor, { opacity: 0, scale: 0, duration: 0.3 }, DRAW + 0.3);
  groups.forEach(function(g, gi){
    var shapes = $$('[pathLength]', g);
    tl.to(shapes, { strokeDashoffset: 0, duration: 0.7, stagger: 0.4 / shapes.length, ease: 'power1.inOut' }, T0 + gi * STEP);
  });
}
/* the loader can be skipped with a click or a key */
loader.addEventListener('click', function(){ if (tl && tl.isActive()) tl.progress(1); });

addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
