// Hidden Camden marketing site — light touches only.
// Each block is a leading-semicolon IIFE so no block can merge with the next.

// Burger menu: toggle the full-screen mobile overlay.
;(function () {
  var burger = document.querySelector('.nav__burger')
  var menu = document.getElementById('mobile-menu')
  if (!burger || !menu) return
  function setOpen(open) {
    document.body.classList.toggle('nav-open', open)
    burger.setAttribute('aria-expanded', String(open))
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    menu.setAttribute('aria-hidden', String(!open))
  }
  burger.addEventListener('click', function () {
    setOpen(!document.body.classList.contains('nav-open'))
  })
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false) })
  })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false)
  })
})()

// Hero carousel: cross-fade slides on an interval, with dot navigation.
;(function () {
  var car = document.getElementById('hero-carousel')
  var dotsWrap = document.getElementById('hero-dots')
  if (!car || !dotsWrap) return
  var slides = car.querySelectorAll('.hero__slide')
  if (slides.length < 2) return
  var i = 0, dots = [], timer
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  slides.forEach(function (s, idx) {
    var d = document.createElement('button')
    d.className = 'hero__dot' + (idx === 0 ? ' is-active' : '')
    d.setAttribute('aria-label', 'Show image ' + (idx + 1))
    d.addEventListener('click', function () { go(idx); restart() })
    dotsWrap.appendChild(d)
    dots.push(d)
  })
  function go(n) {
    slides[i].classList.remove('is-active'); dots[i].classList.remove('is-active')
    i = (n + slides.length) % slides.length
    slides[i].classList.add('is-active'); dots[i].classList.add('is-active')
  }
  function start() { if (!reduce) timer = setInterval(function () { go(i + 1) }, 4500) }
  function restart() { clearInterval(timer); start() }
  start()
})()

// Reveal-on-scroll: fade the major blocks up as they enter.
;(function () {
  var targets = document.querySelectorAll(
    '.film, .step, .voice, .tier, .charity, .sponsor-lead, .logo-wall, .section__head, .wh-card, .offer, .why__item'
  )
  targets.forEach(function (el) { el.classList.add('reveal') })
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in') })
    return
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target) }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
  targets.forEach(function (el) { io.observe(el) })
})()

// Stub links: stop the dead "#" jumps.
;(function () {
  document.querySelectorAll('.store-badge[href="#"], .film__play').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault() })
  })
})()
