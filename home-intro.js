(() => {
  const landing = document.querySelector('.landing');
  const gsap = window.gsap;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactLayout = window.matchMedia('(max-aspect-ratio: 4/3)');
  const isHomeRoute = () => {
    const route = location.hash.replace(/^#/, '').split(/[/?]/)[0];
    return !route || route === 'home';
  };

  if (!landing) return;

  const stage = document.querySelector('.stage');
  const wine = document.querySelector('.hero-home .wine-word');
  const motto = document.querySelector('.hero-home .motto');
  const brand = document.querySelector('.site-header .brand-cn');
  const signature = document.querySelector('.site-header .signature');
  const navigation = document.querySelector('.site-header .nav');
  const rules = [...document.querySelectorAll('.rule')];
  const subject = document.querySelector('.top-subject');
  const studioTitle = document.querySelector('.studio-title');
  const framing = [...document.querySelectorAll('.hero-home .brackets, .hero-home .pixel-cloud')];
  const headerPieces = [brand, signature, navigation].filter(Boolean);
  const bodyPieces = [subject, studioTitle, ...framing].filter(Boolean);
  const allAnimated = [wine, motto, ...headerPieces, ...rules, ...bodyPieces].filter(Boolean);
  let timeline = null;
  let startFrame = 0;

  const resetToFinalState = () => {
    if (startFrame) cancelAnimationFrame(startFrame);
    startFrame = 0;
    timeline?.kill();
    timeline = null;

    if (gsap && allAnimated.length) {
      gsap.set(allAnimated, {
        clearProps: 'opacity,visibility,transform,willChange'
      });
    }

    landing.classList.remove('is-home-intro-pending', 'is-home-intro-running');
  };

  const canAnimate = Boolean(
    gsap
    && !reducedMotion.matches
    && !compactLayout.matches
    && stage
    && wine
    && motto
  );

  if (!canAnimate) {
    resetToFinalState();
    return;
  }

  const start = () => {
    startFrame = 0;
    resetToFinalState();
    if (!isHomeRoute()) {
      return;
    }

    landing.classList.add('is-home-intro-pending', 'is-home-intro-running');

    /* Read the approved final composition once, then express the opening
       positions only as compositor transforms on those same DOM elements. */
    const stageRect = stage.getBoundingClientRect();
    const wineRect = wine.getBoundingClientRect();
    const mottoRect = motto.getBoundingClientRect();
    const openingTop = window.innerHeight * .315;
    const wineStartX = stageRect.left + stageRect.width * .17 - wineRect.left;
    const wineStartY = openingTop - wineRect.top;
    const mottoStartX = stageRect.left + stageRect.width * .565 - mottoRect.left;
    const mottoStartY = openingTop - mottoRect.top;
    const ruleFinalOpacity = new Map(
      rules.map((rule) => [rule, Number.parseFloat(getComputedStyle(rule).opacity) || .38])
    );

    gsap.set(wine, {
      autoAlpha: 1,
      x: wineStartX,
      y: wineStartY,
      willChange: 'transform, opacity'
    });
    gsap.set(motto, {
      autoAlpha: 1,
      x: mottoStartX,
      y: mottoStartY,
      willChange: 'transform, opacity'
    });
    gsap.set(headerPieces, {
      autoAlpha: 0,
      y: -18,
      willChange: 'transform, opacity'
    });
    gsap.set(rules, {
      autoAlpha: 0,
      y: -18,
      willChange: 'transform, opacity'
    });
    gsap.set(subject, {
      autoAlpha: 0,
      willChange: 'opacity'
    });
    gsap.set([studioTitle, ...framing].filter(Boolean), {
      autoAlpha: 0,
      y: -22,
      willChange: 'transform, opacity'
    });

    timeline = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: resetToFinalState
    });

    timeline
      .addLabel('separate', .08)
      .to(wine, {
        x: 0,
        duration: .42
      }, 'separate')
      .to(motto, {
        x: 0,
        duration: .42
      }, 'separate')
      .addLabel('descend', .5)
      .to(wine, {
        y: 0,
        duration: .62,
        ease: 'power4.inOut'
      }, 'descend')
      .to(motto, {
        y: 0,
        duration: .62,
        ease: 'power4.inOut'
      }, 'descend')
      .addLabel('pageReveal', 1.04)
      .to(headerPieces, {
        autoAlpha: 1,
        y: 0,
        duration: .38,
        ease: 'power3.out',
        stagger: { each: .025, from: 'start' }
      }, 'pageReveal')
      .to(rules, {
        autoAlpha: (_, rule) => ruleFinalOpacity.get(rule),
        y: 0,
        duration: .28,
        ease: 'power2.out',
        stagger: .02
      }, 'pageReveal')
      .to([studioTitle, ...framing].filter(Boolean), {
        autoAlpha: 1,
        y: 0,
        duration: .4,
        ease: 'power3.out',
        stagger: { each: .035, from: 'center' }
      }, 'pageReveal+=.06')
      /* The keychain is already at its approved final position. Reveal it only
         after the navigation and supporting type have landed, with no motion
         transform to clear and therefore no end-of-intro position jump. */
      .to(subject, {
        autoAlpha: 1,
        duration: .26,
        ease: 'power2.out'
      }, 'pageReveal+=.62');
  };

  const queueStart = () => {
    if (startFrame) cancelAnimationFrame(startFrame);
    startFrame = requestAnimationFrame(start);
  };

  const images = [
    wine.querySelector('img'),
    motto.querySelector('img'),
    signature?.querySelector('img')
  ].filter(Boolean);
  const decoded = Promise.allSettled(images.map((image) => image.decode?.() || Promise.resolve()));
  const decodeTimeout = new Promise((resolve) => window.setTimeout(resolve, 700));
  const ready = Promise.race([decoded, decodeTimeout]);
  ready.then(() => {
    if (isHomeRoute()) queueStart();
    else resetToFinalState();
  });

  window.addEventListener('hashchange', () => {
    if (!isHomeRoute()) {
      resetToFinalState();
      return;
    }
    ready.then(queueStart);
  });
  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) resetToFinalState();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') resetToFinalState();
  });
})();
