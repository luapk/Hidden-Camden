// Hidden Camden marketing site — light touches only.

// Reveal-on-scroll: tag the major blocks, fade them up as they enter.
(function () {
  var targets = document.querySelectorAll(
    '.step, .tour, .voice, .tier, .charity, .sponsor-lead, .logo-wall, .section__head'
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

// Store buttons are stubs until the apps ship. Keep the anchor jump for the
// footer/download CTA, but make the "coming soon" honest on the store badges.
document.querySelectorAll('.store-badge[href="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault()
    a.setAttribute('data-tapped', '1')
  })
})
