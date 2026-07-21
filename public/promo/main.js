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

// Hero carousel: cross-fade the slides on an interval (no dots).
;(function () {
  var car = document.getElementById('hero-carousel')
  if (!car) return
  var slides = car.querySelectorAll('.hero__slide')
  if (slides.length < 2) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  var i = 0
  setInterval(function () {
    slides[i].classList.remove('is-active')
    i = (i + 1) % slides.length
    slides[i].classList.add('is-active')
  }, 4500)
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

// Voice preview: one shared clip of the house guide voice, played from the
// button seated over each portrait. Tapping another card hands the audio over.
;(function () {
  var buttons = document.querySelectorAll('.voice__play')
  if (!buttons.length) return
  var audio = new Audio('/promo/assets/voice-preview.mp3')
  audio.preload = 'none'
  var active = null

  function reset(btn) {
    if (!btn) return
    btn.classList.remove('is-playing')
    btn.setAttribute('aria-pressed', 'false')
    var t = btn.querySelector('.voice__play-txt')
    if (t) t.textContent = 'Preview voice'
  }
  function activate(btn) {
    btn.classList.add('is-playing')
    btn.setAttribute('aria-pressed', 'true')
    var t = btn.querySelector('.voice__play-txt')
    if (t) t.textContent = 'Playing'
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (active === btn && !audio.paused) {
        audio.pause()
        return
      }
      reset(active)
      active = btn
      activate(btn)
      audio.currentTime = 0
      var play = audio.play()
      if (play && play.catch) {
        play.catch(function () { reset(btn); active = null })
      }
    })
  })

  audio.addEventListener('pause', function () { reset(active) })
  audio.addEventListener('ended', function () { reset(active); active = null })
})()

// Stub links: stop the dead "#" jumps.
;(function () {
  document.querySelectorAll('.store-badge[href="#"], .film__play').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault() })
  })
})()
