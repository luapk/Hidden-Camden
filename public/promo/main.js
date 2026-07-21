// Hidden Camden marketing site — light touches only.

// Burger menu: toggle the full-screen mobile overlay.
(function () {
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
  // Close when a menu link is tapped, or on Escape.
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false) })
  })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false)
  })
})()

// Reveal-on-scroll: tag the major blocks, fade them up as they enter.
(function () {
  var targets = document.querySelectorAll(
    '.film, .step, .voice, .tier, .charity, .sponsor-lead, .logo-wall, .section__head'
  )
  targets.forEach(function (el) { el.classList.add('reveal') })

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in') })
    return
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          io.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  )
  targets.forEach(function (el) { io.observe(el) })
})()

// Store buttons and the film are stubs until the assets ship. Keep the anchor
// jump for the download CTA, but stop the dead "#" links from jumping.
document.querySelectorAll('.store-badge[href="#"], .film__play').forEach(function (el) {
  el.addEventListener('click', function (e) {
    e.preventDefault()
  })
})
