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
        trigger: mask,
        start: 'top 78%',
        toggleActions: 'play none none reverse'
      }
    });
    timeline.to(rows, {
      scaleX: 0,
      duration: 0.28,
      ease: 'power2.out',
      stagger: { each: 0.055 }
    });
    remember(timeline);
    return timeline;
  };

  const addCapabilityScrollReveal = () => {
    const panel = classPage.querySelector('.class-panel--sticker');
    const copy = panel?.querySelector('.class-capability-scroll-copy');
    const index = copy?.querySelector('.class-capability-scroll-copy__index');
    const title = copy?.querySelector('.class-capability-scroll-copy__title');
    const body = copy?.querySelector('.class-capability-scroll-copy__body');
    const titleWords = title ? [...title.querySelectorAll('.class-capability-scroll-word')] : [];
    const bodyWords = body ? [...body.querySelectorAll('.class-capability-scroll-word')] : [];
    if (!panel || !copy || !index || !title || !body || !titleWords.length || !bodyWords.length) return null;

    titleWords.forEach((word) => {
      if (word.dataset.splitReady === 'true') return;

      const fragment = document.createDocumentFragment();
      [...word.textContent].forEach((character) => {
        const characterElement = document.createElement('span');
        characterElement.className = 'class-capability-title-char';
        characterElement.textContent = character === ' ' ? '\u00a0' : character;
        fragment.append(characterElement);
      });

      word.textContent = '';
      word.append(fragment);
      word.dataset.splitReady = 'true';
    });

    const titleCharacters = [...title.querySelectorAll('.class-capability-title-char')];
    const revealTargets = [index, ...bodyWords];

    gsap.set([index, title, body], { rotation: 0, transformOrigin: '0% 50%' });
    gsap.set(titleCharacters, { opacity: 0, y: 40 });
    gsap.set(revealTargets, {
      opacity: 0,
      y: '1.65cqw',
      rotation: 5,
      filter: 'blur(11px)',
      transformOrigin: '0% 100%'
    });

    const titleTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: title,
        start: 'top bottom-=100px',
        toggleActions: 'play none none reverse',
        invalidateOnRefresh: true
      }
    });

    titleTimeline.to(titleCharacters, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      stagger: 0.06,
      ease: 'power3.out'
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'top 78%',
        end: 'top 38%',
        scrub: 0.38,
        invalidateOnRefresh: true
      }
    });

    timeline.to(revealTargets, {
        opacity: 1,
        y: 0,
        rotation: 0,
        filter: 'blur(0px)',
        duration: 0.62,
        stagger: { each: 0.055 },
        ease: 'power2.out'
      });

    remember(titleTimeline);
    remember(timeline);
    return timeline;
  };

  const addCapabilityCardsReveal = () => {
    const reveal = classPage.querySelector('.class-capability-card-reveal');
    const cards = reveal ? [...reveal.children] : [];
    if (!reveal || !cards.length) return null;

    gsap.set(cards, {
      autoAlpha: 1,
      scaleX: 1,
      transformOrigin: 'right center'
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: reveal,
        start: '71% 88%',
        end: '71% 46%',
        scrub: 0.42,
        invalidateOnRefresh: true
      }
    });

    timeline.to(cards, {
      scaleX: 0,
      duration: 1,
      ease: 'power2.out'
    });

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
        start: 'top 96%',
        end: 'top 52%',
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });

    timeline.fromTo(
      stage,
      {
        y: () => Math.min(window.innerHeight * .14, classPage.clientWidth * .085),
        autoAlpha: .9
      },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        ease: 'power2.out'
      }
    );

    remember(timeline);
    return timeline;
  };

  const addCanMetricsReveal = () => {
    const panel = classPage.querySelector('.class-panel--can');
    const metrics = [...classPage.querySelectorAll('.class-can-metric > span')];
    const title = classPage.querySelector('.class-variable-title--can');
    if (!panel || metrics.length !== 2 || !title) return null;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'top 76%',
        end: 'top 30%',
        scrub: 0.65,
        invalidateOnRefresh: true
      }
    });

    timeline
      .fromTo(
        metrics[0],
        { yPercent: 115, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: .52, ease: 'power3.out' },
        0
      )
      .fromTo(
        metrics[1],
        { yPercent: 115, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: .52, ease: 'power3.out' },
        .18
      )
      .fromTo(
        title,
        { y: '2.2cqw', autoAlpha: 0, clipPath: 'inset(100% 0 0 0)' },
        {
          y: 0,
          autoAlpha: 1,
          clipPath: 'inset(0% 0 0 0)',
          duration: .68,
          ease: 'power3.out'
        },
        .38
      );

    remember(timeline);
    return timeline;
  };

  const addStarCopyReveal = () => {
    const panel = classPage.querySelector('.class-panel--star');
    const reveal = panel?.querySelector('.class-star-copy-reveal');
    if (!panel || !reveal) return null;

    const groups = [
      [...reveal.querySelectorAll('[data-copy-group="left-title"]')],
      [...reveal.querySelectorAll('[data-copy-group="left-pills"]')],
      [...reveal.querySelectorAll('[data-copy-group="left-detail"]')],
      [...reveal.querySelectorAll('[data-copy-group="right-pills"]')],
      [...reveal.querySelectorAll('[data-copy-group="right-title"]')]
    ].filter((group) => group.length);
    if (!groups.length) return null;

    const masks = groups.flat();
    reveal.classList.add('is-motion-ready');
    gsap.set(masks, { scaleX: 1, transformOrigin: 'right center' });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'top bottom',
        end: 'top 30%',
        scrub: 0.52,
        invalidateOnRefresh: true
      }
    });

    timeline.to(masks, {
      scaleX: 0,
      duration: 1,
      ease: 'power2.out'
    });

    remember(timeline);
    return timeline;
  };

  const addVariableUxCopyReveal = () => {
    const panel = classPage.querySelector('.class-panel--variable-ux');
    const title = panel?.querySelector('.class-variable-title--ux');
    const reveal = panel?.querySelector('.class-variable-ux-copy-reveal');
    const masks = reveal ? [...reveal.children] : [];
    if (!panel || !title || !reveal || !masks.length) return null;

    reveal.classList.add('is-motion-ready');
    gsap.set(masks, { scaleX: 1, transformOrigin: 'right center' });
    gsap.set(title, {
      autoAlpha: 1,
      y: 0,
      clipPath: 'inset(0% 100% 0% 0%)',
      transformOrigin: 'left center'
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'top bottom',
        end: 'top 36%',
        scrub: 0.45,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(masks, { scaleX: 0, duration: 1, ease: 'power2.out' }, 0)
      .to(title, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1,
        ease: 'power2.out'
      }, 0);

    remember(timeline);
    return timeline;
  };

  const addPortfolioCopyReveal = () => {
    const panel = classPage.querySelector('.class-panel--portfolio-reveal');
    const title = panel?.querySelector('.class-figma-warp');
    const reveal = panel?.querySelector('.class-portfolio-copy-reveal');
    const masks = reveal ? [...reveal.children] : [];
    const titleParts = title
      ? [...title.querySelectorAll(':scope > .class-warp-text__source > span')]
      : [];
    if (!panel || !title || !reveal || !masks.length || !titleParts.length) return null;

    reveal.classList.add('is-motion-ready');
    gsap.set(masks, { scaleX: 1, transformOrigin: 'right center' });
    gsap.set(title, { autoAlpha: 1, y: 0, clipPath: 'none' });
    gsap.set(titleParts, { autoAlpha: 0, y: '2.8cqw', filter: 'none' });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'top bottom',
        end: 'top 36%',
        scrub: 0.45,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(masks, { scaleX: 0, duration: 1, ease: 'power2.out' }, 0)
      .to(titleParts, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0cqw)',
        duration: 0.78,
        stagger: { each: 0.08 },
        ease: 'power3.out'
      }, 0.08);

    remember(timeline);
    return timeline;
  };

  const addPortfolioSmileScroll = () => {
    const panel = classPage.querySelector('.class-panel--portfolio-reveal');
    const module = panel?.querySelector('.class-portfolio-reveal');
    const smile = module?.querySelector('.class-portfolio-piece--smile');
    if (!panel || !module || !smile) return null;

    module.classList.add('is-motion-ready');
    gsap.set(smile, {
      x: '-34cqw',
      rotation: -16,
      transformOrigin: '50% 50%',
      transition: 'none'
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: module,
        start: 'top 96%',
        end: 'top 40%',
        scrub: 0.75,
        invalidateOnRefresh: true
      }
    });

    timeline.to(smile, {
      x: 0,
      rotation: 0,
      duration: 1,
      ease: 'power2.out'
    });

    remember(timeline);
    return timeline;
  };

  const addPortfolioDetailCopyReveal = () => {
    const panel = classPage.querySelector('.class-panel--portfolio-reveal');
    const module = panel?.querySelector('.class-portfolio-reveal');
    const title = module?.querySelector('.class-portfolio-title-warp');
    const reveals = [...classPage.querySelectorAll('.class-portfolio-detail-copy-reveal')];
    const indexMask = classPage.querySelector('[data-portfolio-detail-copy="index"]');
    const bodyMasks = [...classPage.querySelectorAll('[data-portfolio-detail-copy="body"]')];
    if (!panel || !module || !title || !reveals.length || !indexMask || !bodyMasks.length) return null;

    reveals.forEach((reveal) => reveal.classList.add('is-motion-ready'));
    gsap.set(indexMask, { scaleX: 1, transformOrigin: 'right center' });
    gsap.set(bodyMasks, { scaleX: 1, transformOrigin: 'right center' });
    gsap.set(title, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      clipPath: 'inset(0% 100% 0% 0%)',
      transformOrigin: 'left center'
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: module,
        start: 'top bottom',
        end: 'center center',
        scrub: 0.45,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(indexMask, { scaleX: 0, duration: 0.42, ease: 'power2.out' }, 0)
      .to(bodyMasks, { scaleX: 0, duration: 1.04, ease: 'power2.inOut' }, 0)
      .to(title, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1,
        ease: 'power2.out'
      }, 0);

    remember(timeline);
    return timeline;
  };

  const addRecruitingCopyReveal = () => {
    const scene = classPage.querySelector('.class-panel--recruiting-scene');
    const continuation = classPage.querySelector('.class-panel--recruiting-continuation');
    const sceneReveal = scene?.querySelector('.class-recruiting-copy-reveal');
    const continuationReveal = continuation?.querySelector('.class-recruiting-continuation-copy-reveal');
    const titleMasks = sceneReveal ? [...sceneReveal.querySelectorAll('[data-recruiting-copy="title"]')] : [];
    const pillMasks = sceneReveal ? [...sceneReveal.querySelectorAll('[data-recruiting-copy="pills"]')] : [];
    const continuationPillMasks = continuationReveal
      ? [...continuationReveal.querySelectorAll('[data-recruiting-copy="pills-continuation"]')]
      : [];
    const bodyMasks = continuationReveal
      ? [...continuationReveal.querySelectorAll('[data-recruiting-copy="body"]')]
      : [];
    const masks = [...titleMasks, ...pillMasks, ...continuationPillMasks, ...bodyMasks];
    if (!scene || !continuation || !sceneReveal || !continuationReveal || !masks.length) return null;

    sceneReveal.classList.add('is-motion-ready');
    continuationReveal.classList.add('is-motion-ready');
    gsap.set(masks, { scaleX: 1, transformOrigin: 'right center' });

    const titleTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: 'top bottom',
        end: 'top 36%',
        scrub: 0.45,
        invalidateOnRefresh: true
      }
    });

    titleTimeline.to(titleMasks, {
      scaleX: 0,
      duration: 1,
      ease: 'power2.out'
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        endTrigger: continuation,
        start: 'top bottom',
        end: 'top 68%',
        scrub: 0.28,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(pillMasks, { scaleX: 0, duration: 0.78, ease: 'power2.out' }, 0.08)
      .to(continuationPillMasks, { scaleX: 0, duration: 0.22, ease: 'power2.out' }, 0.72)
      .to(bodyMasks, { scaleX: 0, duration: 0.34, ease: 'power2.out' }, 0.66);

    remember(titleTimeline);
    remember(timeline);
    return timeline;
  };

  const addInterviewCopyReveal = () => {
    const panel = classPage.querySelector('.class-panel--recruiting-continuation');
    const reveal = panel?.querySelector('.class-recruiting-continuation-copy-reveal');
    const indexMask = reveal?.querySelector('[data-interview-copy="index"]');
    const titleMask = reveal?.querySelector('[data-interview-copy="title"]');
    const bodyMasks = reveal ? [...reveal.querySelectorAll('[data-interview-copy="body"]')] : [];
    const masks = [indexMask, titleMask, ...bodyMasks].filter(Boolean);
    if (!panel || !reveal || !indexMask || !titleMask || !bodyMasks.length) return null;

    reveal.classList.add('is-motion-ready');
    gsap.set(masks, { scaleX: 1, transformOrigin: 'right center' });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'top bottom',
        end: 'top 36%',
        scrub: 0.45,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(indexMask, { scaleX: 0, duration: 0.4, ease: 'power2.out' }, 0)
      .to(titleMask, { scaleX: 0, duration: 0.82, ease: 'power2.out' }, 0.08)
      .to(bodyMasks, { scaleX: 0, duration: 0.62, ease: 'power2.out' }, 0.38);

    remember(timeline);
    return timeline;
  };

  const addFeedbackHeadingEntrance = () => {
    const heading = classPage.querySelector('.class-feedback-heading');
    const index = heading?.querySelector('.class-feedback-heading__index');
    const parts = heading ? [...heading.querySelectorAll('.class-feedback-heading__part')] : [];
    if (!heading || !index || !parts.length) return null;

    gsap.set(heading, { autoAlpha: 1 });
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .fromTo(
        index,
        { autoAlpha: 0, y: '.45cqw' },
        { autoAlpha: 1, y: 0, duration: .42, clearProps: 'transform,opacity,visibility' },
        0
      )
      .fromTo(
        parts,
        { autoAlpha: 0, y: '1.15cqw', filter: 'blur(.18cqw)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0cqw)',
          duration: .78,
          stagger: .13,
          clearProps: 'transform,opacity,visibility,filter'
        },
        .12
      );

    return timeline;
  };

  const addAudienceHeadingEntrance = () => {
    const heading = classPage.querySelector('.class-audience-heading');
    const index = heading?.querySelector('.class-audience-heading__index');
    const parts = heading ? [...heading.querySelectorAll('.class-audience-heading__part')] : [];
    if (!heading || !index || !parts.length) return null;

    gsap.set(heading, { autoAlpha: 1 });
    const timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: {
        trigger: heading,
        start: 'top 78%',
        toggleActions: 'play none none reverse',
        invalidateOnRefresh: true
      }
    });

    timeline
      .fromTo(
        index,
        { autoAlpha: 0, y: '.45cqw' },
        { autoAlpha: 1, y: 0, duration: .42, clearProps: 'transform,opacity,visibility' },
        0
      )
      .fromTo(
        parts,
        { autoAlpha: 0, y: '1.15cqw', filter: 'blur(.18cqw)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0cqw)',
          duration: .78,
          stagger: .13,
          clearProps: 'transform,opacity,visibility,filter'
        },
        .12
      );

    remember(timeline);
    return timeline;
  };

  const buildClassMotion = () => {
    const cleanups = [];
    classTriggers = [];

    const canCleanup = prepareCanScrollPlayback();
    if (canCleanup) cleanups.push(canCleanup);

    addFeedbackHeadingEntrance();
    addAudienceHeadingEntrance();

    addCanMetricsReveal();
    addStarCopyReveal();

    addVariableUxCopyReveal();
    addPortfolioCopyReveal();
    addPortfolioSmileScroll();
    addPortfolioDetailCopyReveal();
    addRecruitingCopyReveal();
    addInterviewCopyReveal();

    addCurriculumLineReveal();
    addCapabilityScrollReveal();
    addCapabilityCardsReveal();
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
      const heading = classPage.querySelector('.class-feedback-heading');
      const audienceHeading = classPage.querySelector('.class-audience-heading');
      const starCopyReveal = classPage.querySelector('.class-star-copy-reveal');
      const variableUxCopyReveal = classPage.querySelector('.class-variable-ux-copy-reveal');
      const variableUxTitle = classPage.querySelector('.class-variable-title--ux');
      const portfolioCopyReveal = classPage.querySelector('.class-portfolio-copy-reveal');
      const portfolioTitle = classPage.querySelector('.class-figma-warp');
      const portfolioSmile = classPage.querySelector('.class-portfolio-piece--smile');
      const portfolioDetailCopyReveals = [...classPage.querySelectorAll('.class-portfolio-detail-copy-reveal')];
      const portfolioDetailTitle = classPage.querySelector('.class-portfolio-title-warp');
      const recruitingCopyReveals = [...classPage.querySelectorAll('.class-recruiting-copy-reveal, .class-recruiting-continuation-copy-reveal')];
      const capabilityScrollCopy = classPage.querySelector('.class-capability-scroll-copy');
      const capabilityCardReveal = classPage.querySelector('.class-capability-card-reveal');
      stage?.classList.remove('is-playing');
      stage?.classList.add('is-complete');
      mask?.classList.add('is-revealed');
      if (heading) gsap.set(heading, { autoAlpha: 1 });
      if (audienceHeading) {
        gsap.set(audienceHeading, { autoAlpha: 1 });
        gsap.set(audienceHeading.querySelectorAll('.class-audience-heading__index, .class-audience-heading__part'), {
          autoAlpha: 1,
          y: 0,
          filter: 'none'
        });
      }
      if (starCopyReveal) gsap.set(starCopyReveal.children, { scaleX: 0 });
      if (variableUxCopyReveal) gsap.set(variableUxCopyReveal.children, { scaleX: 0 });
      if (variableUxTitle) gsap.set(variableUxTitle, { autoAlpha: 1, y: 0, clipPath: 'none' });
      if (portfolioCopyReveal) gsap.set(portfolioCopyReveal.children, { scaleX: 0 });
      if (portfolioTitle) gsap.set(portfolioTitle, { autoAlpha: 1, y: 0, clipPath: 'none' });
      if (portfolioTitle) {
        gsap.set(portfolioTitle.querySelectorAll(':scope > .class-warp-text__source > span'), {
          autoAlpha: 1,
          y: 0,
          filter: 'none'
        });
      }
      if (portfolioSmile) gsap.set(portfolioSmile, { x: 0, transition: 'none' });
      portfolioDetailCopyReveals.forEach((reveal) => gsap.set(reveal.children, { scaleX: 0 }));
      if (portfolioDetailTitle) gsap.set(portfolioDetailTitle, { autoAlpha: 1, y: 0, clipPath: 'none' });
      if (portfolioDetailTitle) {
        gsap.set(portfolioDetailTitle.querySelectorAll(':scope > .class-warp-text__source > span'), {
          autoAlpha: 1,
          y: 0,
          filter: 'none'
        });
      }
      recruitingCopyReveals.forEach((reveal) => gsap.set(reveal.children, { scaleX: 0 }));
      if (capabilityScrollCopy) {
        gsap.set(capabilityScrollCopy.querySelectorAll('.class-capability-scroll-copy__index, .class-capability-scroll-word, .class-capability-title-char'), {
          opacity: 1,
          y: 0,
          filter: 'none'
        });
        gsap.set(capabilityScrollCopy.querySelectorAll('.class-capability-scroll-copy__index, .class-capability-scroll-copy__title, .class-capability-scroll-copy__body'), {
          rotation: 0
        });
      }
      if (capabilityCardReveal) gsap.set(capabilityCardReveal.children, { autoAlpha: 1, scaleX: 0 });
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
