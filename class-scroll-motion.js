(() => {
  const landing = document.querySelector('.landing');
  const classPage = document.querySelector('.class-page');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!landing || !classPage || !gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  let initialized = false;
  let classTriggers = [];

  const remember = (animation) => {
    if (animation?.scrollTrigger) classTriggers.push(animation.scrollTrigger);
    return animation;
  };

  const setClassTriggersEnabled = (enabled) => {
    classTriggers.forEach((trigger) => {
      if (enabled) trigger.enable(false, true);
      else trigger.disable(false, true);
    });
  };

  const refreshClassMotion = () => {
    if (landing.dataset.page !== 'class') return;
    requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
  };

  /* Keep the approved CSS keyframes exactly as authored. ScrollTrigger only
     scrubs their clock, so the bottle, pour and copy retain their trajectories. */
  const prepareCanScrollPlayback = () => {
    const stage = classPage.querySelector('.class-can-stage');
    const object = stage?.querySelector('.class-can-object');
    const pour = stage?.querySelector('.class-can-pour');
    const copy = stage?.querySelector('.class-can-copy');
    const trigger = classPage.querySelector('.class-panel--can');
    if (!stage || !object || !pour || !copy || !trigger) return null;

    stage.classList.remove('is-complete');
    stage.classList.add('is-playing');

    const cssAnimations = [object, pour, copy]
      .map((element) => element.getAnimations()[0])
      .filter(Boolean);

    cssAnimations.forEach((animation) => {
      animation.pause();
      animation.currentTime = 0;
    });

    const clock = { progress: 0 };
    const syncOriginalKeyframes = () => {
      cssAnimations.forEach((animation) => {
        const duration = Number(animation.effect?.getTiming().duration) || 4800;
        /* Each original keyframe keeps its own timing curve, but all three
           layers finish together at the end of the scroll range. */
        animation.currentTime = clock.progress * duration;
      });
    };

    syncOriginalKeyframes();
    const tween = remember(gsap.to(clock, {
      progress: 1,
      ease: 'none',
      onUpdate: syncOriginalKeyframes,
      scrollTrigger: {
        trigger,
        start: 'top 92%',
        end: 'bottom 8%',
        scrub: 0.85,
        invalidateOnRefresh: true
      }
    }));

    return () => {
      tween?.kill();
      cssAnimations.forEach((animation) => animation.cancel());
      stage.classList.remove('is-playing');
    };
  };

  const addLayeredEntrance = ({ trigger, title, decorations = [] }) => {
    if (!trigger || !title) return null;

    const titleParts = title.children.length > 1 ? [...title.children] : [title];

    const timeline = gsap.timeline({
      defaults: { ease: 'power4.out' },
      scrollTrigger: {
        trigger,
        start: 'top 82%',
        toggleActions: 'play none none none',
        once: true
      }
    });

    gsap.set(title, { autoAlpha: 1 });
    timeline.fromTo(
      titleParts,
      { autoAlpha: 0, x: '9cqw' },
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.72,
        clearProps: 'transform,opacity,visibility',
        stagger: 0.14
      },
      0
    );

    decorations.forEach(({ element, from, at = 0.12, duration = 0.62 }) => {
      if (!element) return;
      timeline.fromTo(
        element,
        { autoAlpha: 0, ...from },
        { autoAlpha: 1, x: 0, y: 0, scale: 1, scaleX: 1, duration, clearProps: 'transform,opacity,visibility' },
        at
      );
    });

    remember(timeline);
    return timeline;
  };

  const addCurriculumLineReveal = () => {
    const mask = classPage.querySelector('.class-curriculum-copy-mask');
    const panel = classPage.querySelector('.class-panel--curriculum-mosaic');
    const rows = mask ? [...mask.children] : [];
    if (!mask || !panel || !rows.length) return null;

    mask.classList.remove('is-revealed');
    mask.classList.add('is-motion-ready');
    gsap.set(rows, { scaleX: 1, transformOrigin: 'right center' });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        /* The copy mask intentionally overflows the 52cqw source slice. Start
           pinning when that overflowed copy reaches a readable position, not
           when the panel's hidden top reaches the viewport. This keeps every
           line in-frame while the reveal is scrubbed. */
        start: () => {
          const panelTop = panel.getBoundingClientRect().top + window.scrollY;
          const copyTop = Number(mask.offsetTop) || 0;
          const readableTop = Math.min(window.innerHeight * 0.18, 180);
          return panelTop + copyTop - readableTop;
        },
        end: () => `+=${Math.max(window.innerHeight * 1.35, mask.offsetHeight * 2.5)}`,
        pin: panel,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 0.85,
        invalidateOnRefresh: true
      }
    });
    timeline.to(rows, {
      scaleX: 0,
      duration: 1,
      ease: 'none',
      stagger: { each: 0.12 }
    });
    remember(timeline);
    return timeline;
  };

  const addCapabilityScrollReveal = () => {
    const panel = classPage.querySelector('.class-panel--sticker');
    const left = panel?.querySelector('.class-capability-title-layer--left');
    const cleaner = panel?.querySelector('.class-capability-warp-cleaner');
    const title = panel?.querySelector('.class-capability-warp');
    const right = panel?.querySelector('.class-capability-title-layer--right');
    if (!panel || !left || !cleaner || !title || !right) return null;

    panel.classList.remove('is-capability-motion-ready', 'is-capability-entered');
    gsap.set([left, cleaner, title, right], { autoAlpha: 1 });
    gsap.set(left, { x: '-22cqw', y: '1.2cqw' });
    gsap.set([cleaner, title], { x: '-10cqw', y: '1.2cqw' });
    gsap.set(right, { x: '22cqw', y: '-1.2cqw' });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'top 86%',
        end: 'top 36%',
        scrub: 0.75,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(left, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' }, 0)
      .to([cleaner, title], { x: 0, y: 0, duration: 0.72, ease: 'power2.out' }, 0.14)
      .to(right, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' }, 0.26);

    remember(timeline);
    return timeline;
  };

  /* A restrained depth pass inspired by the reference site's editorial
     scroll: only the already-existing decorative layers drift, while the
     baked artwork, copy, and interaction positions remain untouched. */
  const addClassDepthParallax = () => {
    const passes = [
      { selector: '.class-variable-wine-dot', from: '-1.7cqw', to: '1.7cqw' },
      { selector: '.class-variable-ux-mosaic', from: '2.2cqw', to: '-2.2cqw' },
      { selector: '.class-curriculum-mosaic', from: '-2.4cqw', to: '2.4cqw' },
      { selector: '.class-sticker-mosaic', from: '2.6cqw', to: '-2.6cqw' }
    ];

    passes.forEach(({ selector, from, to }) => {
      const element = classPage.querySelector(selector);
      const trigger = element?.closest('.class-panel, .class-capability-slot');
      if (!element || !trigger) return;

      const tween = gsap.fromTo(
        element,
        { y: from },
        {
          y: to,
          ease: 'none',
          scrollTrigger: {
            trigger,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.15,
            invalidateOnRefresh: true
          }
        }
      );
      remember(tween);
    });
  };

  const addGrayModuleEntrance = () => {
    const reveal = classPage.querySelector('.class-capability-reveal');
    const stage = reveal?.querySelector('.class-gray-stage');
    if (!reveal || !stage) return null;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: reveal,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
        invalidateOnRefresh: true
      }
    });

    timeline.fromTo(
      stage,
      { y: '8.5cqw', scale: .975, transformOrigin: '50% 100%' },
      {
        y: 0,
        scale: 1,
        duration: 1.34,
        ease: 'back.out(2.15)',
        clearProps: 'transform'
      }
    );

    remember(timeline);
    return timeline;
  };

  const buildClassMotion = () => {
    const cleanups = [];
    classTriggers = [];

    const canCleanup = prepareCanScrollPlayback();
    if (canCleanup) cleanups.push(canCleanup);

    addLayeredEntrance({
      trigger: classPage.querySelector('.class-panel--can'),
      title: classPage.querySelector('.class-variable-title--can'),
      decorations: [{
        element: classPage.querySelector('.class-can-guide--title'),
        from: { scaleX: 0 },
        at: 0.08,
        duration: 0.66
      }]
    });

    addLayeredEntrance({
      trigger: classPage.querySelector('.class-panel--variable-ux'),
      title: classPage.querySelector('.class-variable-title--ux'),
      decorations: [
        {
          element: classPage.querySelector('.class-variable-ux-mosaic'),
          from: { y: '1.2cqw', scale: 0.92 },
          at: 0.2,
          duration: 0.58
        }
      ]
    });

    addCurriculumLineReveal();
    addCapabilityScrollReveal();
    addClassDepthParallax();
    addGrayModuleEntrance();

    return () => cleanups.forEach((cleanup) => cleanup());
  };

  const initialize = () => {
    if (initialized || landing.dataset.page !== 'class') return;
    initialized = true;

    const mediaContext = gsap.matchMedia();
    mediaContext.add('(prefers-reduced-motion: no-preference)', () => buildClassMotion());
    mediaContext.add('(prefers-reduced-motion: reduce)', () => {
      const stage = classPage.querySelector('.class-can-stage');
      const mask = classPage.querySelector('.class-curriculum-copy-mask');
      stage?.classList.remove('is-playing');
      stage?.classList.add('is-complete');
      mask?.classList.add('is-revealed');
    });

    refreshClassMotion();
    document.fonts?.ready.then(refreshClassMotion);
    classPage.querySelectorAll('img').forEach((image) => {
      if (!image.complete) image.addEventListener('load', refreshClassMotion, { once: true });
    });
  };

  const syncRoute = () => {
    const isClass = landing.dataset.page === 'class';
    if (isClass) {
      initialize();
      setClassTriggersEnabled(true);
      refreshClassMotion();
    } else if (initialized) {
      setClassTriggersEnabled(false);
    }
  };

  new MutationObserver(syncRoute).observe(landing, {
    attributes: true,
    attributeFilter: ['data-page']
  });
  window.addEventListener('pageshow', syncRoute);
  syncRoute();
})();
