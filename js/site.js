(function(){
'use strict';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var mobile = matchMedia('(max-width: 700px)').matches;
gsap.registerPlugin(ScrollTrigger);
function $(s){ return document.querySelector(s); }

/* smooth scroll */
var lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var el = document.querySelector(id); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: id === '#main' || id === '#top' ? 0 : -60 });
    });
  });
}

/* header: white once past the hero, hides on scroll down */
var top = $('#top'), lastY = 0;
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function(self){
  var y = self.scroll(), heroEnd = $('#hero').offsetHeight - innerHeight;
  top.classList.toggle('solid', y > heroEnd - 40);
  if (Math.abs(y - lastY) > 4) { top.classList.toggle('hide', y > heroEnd + 200 && y > lastY); lastY = y; }
}});

/* hero: colour flight scrubbed by scroll */
var canvas = $('#flight'), ctx = canvas.getContext('2d');
var N = 160, dir = mobile ? 'img/flight-m/' : 'img/flight/', frames = new Array(N), cur = -1, want = 0;
function src(i){ return dir + String(i + 1).padStart(4, '0') + '.webp'; }
function load(i){ if (frames[i]) return; var im = new Image(); im.decoding = 'async'; im.src = src(i); im.onload = function(){ im.ok = 1; if (i === want || cur < 0) draw(want); }; frames[i] = im; }
function size(){ var r = Math.min(devicePixelRatio || 1, 2); canvas.width = canvas.clientWidth * r; canvas.height = canvas.clientHeight * r; cur = -1; draw(want); }
function nearest(i){ for (var d = 0; d < N; d++){ var a = frames[i - d], b = frames[i + d]; if (a && a.ok) return a; if (b && b.ok) return b; } return null; }
function draw(i){
  want = i; var im = frames[i] && frames[i].ok ? frames[i] : nearest(i); if (!im) return;
  var cw = canvas.width, ch = canvas.height, s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
  var w = im.naturalWidth * s, h = im.naturalHeight * s;
  ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h); cur = i;
}
load(0); for (var k = 0; k < N; k += 8) load(k);
setTimeout(function(){ for (var j = 0; j < N; j++) load(j); }, 600);
addEventListener('resize', size); size();

var heroTl = gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: reduce ? true : 0.4,
  onUpdate: function(self){ var f = Math.min(N - 1, Math.round(self.progress * (N - 1))); if (f !== cur) draw(f); } } });
heroTl.to('.hero-title .ln > span', { yPercent: -112, stagger: 0.04, duration: 0.22, ease: 'none' }, 0.1)
      .to('.hero-vote span, .hero-sub span', { yPercent: -130, duration: 0.15, ease: 'none' }, 0.12)
      .to('.hero-hint', { opacity: 0, duration: 0.1 }, 0);
gsap.utils.toArray('.swap').forEach(function(s, i){
  var at = 0.3 + i * 0.16, last = i === 3;
  heroTl.fromTo(s, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.06, ease: 'none' }, at);
  if (!last) heroTl.to(s, { opacity: 0, y: -40, duration: 0.06, ease: 'none' }, at + 0.12);
});
heroTl.to({}, { duration: 0.01 }, 1);

/* loading screen: the sign is painted and drawn while the flight loads; no scrolling until it lifts */
var html = document.documentElement, loader = $('#loader'), sign = $('.sign');
scrollTo(0, 0);
if (lenis) lenis.stop();
function block(e){ if (html.classList.contains('loading')) e.preventDefault(); }
['wheel', 'touchmove'].forEach(function(t){ addEventListener(t, block, { passive: false }); });
addEventListener('keydown', function(e){ if (html.classList.contains('loading') && /^(Arrow|Page|Home|End| )/.test(e.key)) e.preventDefault(); });
for (var p = 0; p < 40; p++) load(p);
function ready(){ var n = 0; for (var i = 0; i < 40; i++) if (frames[i] && frames[i].ok) n++; return n >= 30; }
function box(a, b){ var r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect(); return { left: r1.left, top: Math.min(r1.top, r2.top), width: r2.right - r1.left, height: Math.max(r1.bottom, r2.bottom) - Math.min(r1.top, r2.top) }; }

function start(){
  html.classList.add('intro'); heroTl.invalidate();
  scrollTo(0, 0); if (lenis) { lenis.scrollTo(0, { immediate: true, force: true }); lenis.start(); }
  ScrollTrigger.refresh();
  setTimeout(function(){ html.classList.remove('intro'); }, 3000);
}
function liftPhone(){
  html.classList.remove('loading');
  gsap.timeline({ onComplete: function(){ loader.remove(); } })
    .to('.sign-art, .sign-urls, #signCursor', { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0)
    .to(sign, { y: -40, duration: 0.5, ease: 'power2.in' }, 0.1)
    .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.35)
    .to(sign, { y: -innerHeight * 0.6, opacity: 0, duration: 1.0, ease: 'expo.inOut' }, 0.4)
    .add(start, 0.75);
}
function lift(){
  if (innerWidth <= 700) return liftPhone();
  var brand = $('.brand'), from = box($('.sign-vote'), $('.sign-name'));
  html.classList.remove('loading');
  gsap.set(brand, { opacity: 0 });
  var to = box($('.brand-vote'), $('.brand-name'));
  // the sign's name flies up into the header logo
  var fly = $('.sign-top').cloneNode(true);
  fly.className = 'sign-top sign-fly';
  fly.style.cssText = 'left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;height:' + from.height + 'px;justify-content:flex-start;color:#1d3c95';
  fly.querySelectorAll('span').forEach(function(s){ s.style.opacity = 1; });
  document.body.appendChild(fly);
  gsap.set('.sign-top', { opacity: 0 });
  var sc = to.width / from.width;
  gsap.timeline({ onComplete: function(){ loader.remove(); fly.remove(); } })
    .to('.sign-art, .sign-sub, .sign-urls, .sign-frame, #signCursor', { opacity: 0, y: 10, duration: 0.45, ease: 'power2.in' }, 0)
    .to(sign, { scale: 1.03, opacity: 0, duration: 0.9, ease: 'power3.in' }, 0.15)
    .to(fly, { x: to.left - from.left, y: to.top - from.top, scale: sc, color: '#ffffff', duration: 1.25, ease: 'expo.inOut' }, 0.2)
    .to(loader, { opacity: 0, duration: 1, ease: 'power2.inOut' }, 0.55)
    .add(start, 0.75)
    .to(brand, { opacity: 1, duration: 0.3 }, 1.35)
    .to(fly, { opacity: 0, duration: 0.25 }, 1.4);
}

if (reduce) { setTimeout(lift, 800); } else {
  var groups = gsap.utils.toArray('#signArt .la').sort(function(a, b){ return a.dataset.o - b.dataset.o; });
  var ground = groups.shift(), art = $('#signArt svg'), cursor = $('#signCursor');
  var T0 = 2.0, STEP = 0.3, DRAW = T0 + groups.length * STEP;
  var tl = gsap.timeline({ delay: 0.25, onComplete: function wait(){ if (ready()) setTimeout(lift, 700); else setTimeout(wait, 200); } });
  tl.fromTo(sign, { y: 50, opacity: 0, rotateX: 8, transformPerspective: 1200 }, { y: 0, opacity: 1, rotateX: 0, duration: 1.1, ease: 'expo.out' })
    .to('.f1 rect', { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.25)
    .to('.f2 rect', { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.4)
    .fromTo('.sign-vote', { opacity: 1, clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'power2.inOut' }, 0.7)
    .fromTo('.sign-name', { opacity: 1, clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.0, ease: 'power3.inOut' }, 0.95)
    .fromTo('.sign-sub', { y: 16, opacity: 0, letterSpacing: '.2em' }, { y: 0, opacity: 1, letterSpacing: '.05em', duration: 0.9, ease: 'power3.out' }, 1.5);
  // the ground line is drawn by an orange pen; each figure is drawn as the pen passes it
  var gl = ground.querySelector('[pathLength]'), pen = { t: 0 };
  // phones: the drawing is shown up close and the view follows the pen, then pulls back to the whole street
  var phone = innerWidth <= 700, S = 2.4, wrap = $('#signArt');
  if (phone) {
    var baseW = wrap.clientWidth, baseH = art.getBoundingClientRect().height;
    wrap.style.overflow = 'hidden'; wrap.style.height = baseH * S + 'px';
    gsap.set(art, { scale: S, transformOrigin: '0 0', x: 0 });
    tl.to(wrap, { height: baseH, duration: 1.2, ease: 'power3.inOut' }, DRAW + 0.1)
      .to(art, { scale: 1, x: 0, duration: 1.2, ease: 'power3.inOut' }, DRAW + 0.1);
  }
  function follow(){
    if (!phone) return;
    var penLocal = (20 + 1600 * pen.t) * (baseW / 1640) * S;
    gsap.set(art, { x: Math.max(baseW - baseW * S, Math.min(0, baseW / 2 - penLocal)) });
  }
  function placePen(){
    follow();
    var sr = sign.getBoundingClientRect(), ar = art.getBoundingClientRect(), k = ar.width / 1640;
    gsap.set(cursor, { left: ar.left - sr.left + (20 + 1600 * pen.t) * k, top: ar.top - sr.top + 330 * k });
  }
  tl.set(cursor, { opacity: 1 }, T0 - 0.2)
    .to(pen, { t: 1, duration: DRAW - T0 + 0.4, ease: 'none', onUpdate: function(){ placePen(); gl.style.strokeDashoffset = 1 - pen.t; } }, T0 - 0.2)
    .to(cursor, { opacity: 0, scale: 0, duration: 0.3 }, DRAW + 0.3);
  groups.forEach(function(g, gi){
    var shapes = g.querySelectorAll('[pathLength]');
    tl.to(shapes, { strokeDashoffset: 0, duration: 0.8, stagger: 0.45 / shapes.length, ease: 'power1.inOut' }, T0 + gi * STEP);
  });
  tl.fromTo('.sign-urls span', { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.18, duration: 0.7, ease: 'power3.out' }, DRAW + 0.2);
}

/* belief: word by word */
var belief = $('#belief');
belief.innerHTML = belief.textContent.split(' ').map(function(w){ return '<span class="w">' + w + '</span>'; }).join(' ');
var words = belief.querySelectorAll('.w');
ScrollTrigger.create({ trigger: belief, start: 'top 80%', end: 'bottom 45%', scrub: true, onUpdate: function(self){
  var n = Math.round(self.progress * words.length);
  words.forEach(function(w, i){ w.classList.toggle('on', i < n); });
}});

/* plan: the photo follows the item in view */
var photos = document.querySelectorAll('.pp'), cap = $('#planCap');
gsap.utils.toArray('.plan-item').forEach(function(item, i){
  ScrollTrigger.create({ trigger: item, start: 'top 55%', end: 'bottom 55%',
    onToggle: function(self){
      if (!self.isActive) { item.classList.remove('on'); return; }
      item.classList.add('on');
      photos.forEach(function(p, j){ p.classList.toggle('on', j === i); });
      cap.textContent = item.dataset.cap;
    } });
  gsap.from(item.children, { y: 50, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 80%' } });
});

/* wide: the frame opens to full bleed */
if (!reduce) {
  gsap.fromTo('#wideFrame', { clipPath: 'inset(10% 10% 10% 10%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
    scrollTrigger: { trigger: '#wideFrame', start: 'top 85%', end: 'top top', scrub: true } });
  gsap.fromTo('#wideFrame img', { yPercent: -8, scale: 1.1 }, { yPercent: 6, scale: 1, ease: 'none',
    scrollTrigger: { trigger: '#wideFrame', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.wide-title span', { yPercent: 60, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '#wideFrame', start: 'top 20%' } });
}

/* ballot: the oval fills in */
gsap.from('.ballot', { y: 120, rotate: 9, opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: '.ballot', start: 'top 85%' } });
ScrollTrigger.create({ trigger: '.ballot', start: 'top 60%', once: true, onEnter: function(){
  gsap.to('#myOval', { '--fill': 1, duration: 0.9, delay: 0.5, ease: 'power2.inOut' });
  gsap.fromTo('.me .name', { color: '#0d1b45' }, { color: '#1d3c95', duration: 0.4, delay: 1.2 });
}});

/* countdown to Nov 2, 2027, polls open 7 AM */
var elec = new Date('2027-11-02T07:00:00-04:00').getTime();
function tick(){
  var ms = Math.max(0, elec - Date.now());
  $('#cdDays').textContent = Math.floor(ms / 864e5);
  $('#cdHrs').textContent = Math.floor(ms / 36e5) % 24;
  $('#cdMin').textContent = Math.floor(ms / 6e4) % 60;
}
tick(); setInterval(tick, 30000);

/* neighborhoods: pinned sideways scroll */
var track = $('#placesTrack'), idx = $('#placeIdx');
if (!mobile) {
  gsap.to(track, { x: function(){ return -(track.scrollWidth - innerWidth); }, ease: 'none',
    scrollTrigger: { trigger: '.places', start: 'top top', end: function(){ return '+=' + (track.scrollWidth - innerWidth); },
      pin: '.places-pin', scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: function(self){ idx.textContent = String(Math.min(10, 1 + Math.floor(self.progress * 10))).padStart(2, '0'); } } });
}

/* marquee follows scroll */
gsap.to('.mq-row', { xPercent: -50, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });

/* about photo reveal */
gsap.fromTo('.about-photo', { '--cover': 1 }, { '--cover': 0, duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: '.about-photo', start: 'top 75%' } });
gsap.from('.about-photo img', { scale: 1.25, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '.about-photo', start: 'top 75%' } });

/* join background drift, give bar */
gsap.fromTo('.join-bg img', { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.join', start: 'top bottom', end: 'bottom top', scrub: true } });
gsap.from('.split-bar i', { scaleX: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.split-bar', start: 'top 85%' } });
gsap.from('.foot-sign', { y: 80, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.foot', start: 'top 85%' } });

/* donate controls */
var amt = 50, freq = 'once', giveBtn = $('#giveBtn');
function radio(group, attr, cb){
  group.querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      group.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-checked', x === b); });
      cb(b.getAttribute(attr));
    });
  });
}
function label(){ giveBtn.textContent = 'Give $' + amt + (freq === 'monthly' ? ' monthly' : ''); }
radio($('.amounts'), 'data-amt', function(v){ amt = v; label(); });
radio($('.freq'), 'data-f', function(v){ freq = v; label(); });

/* volunteer form (mockup: nothing leaves the page) */
$('#joinForm').addEventListener('submit', function(e){
  e.preventDefault();
  var f = e.target;
  if (!f.name.value.trim() || !/\S+@\S+\.\S+/.test(f.email.value)) { (f.name.value.trim() ? f.email : f.name).focus(); return; }
  $('#joinDone').hidden = false;
  f.querySelector('button').disabled = true;
});

addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
