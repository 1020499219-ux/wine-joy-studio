(() => {
  const NAV_ITEMS = Object.freeze([
    Object.freeze({ route: 'home', label: 'home', selectedAsset: './assets/nav-home-selected@2x.png' }),
    Object.freeze({ route: 'works', label: 'works', selectedAsset: './assets/nav-works-selected@2x.png' }),
    Object.freeze({ route: 'about', label: 'about', selectedAsset: './assets/nav-about-selected@2x.png' }),
    Object.freeze({ route: 'class', label: 'class', selectedAsset: './assets/nav-class-selected@2x.png' }),
  ]);

  // Temporary navigation switch. Change `about` to true when the About page
  // is ready; the original four-tab order and spacing restore automatically.
  const NAV_VISIBILITY = Object.freeze({ about: false });
  const visibleNavItems = () => NAV_ITEMS.filter((item) => NAV_VISIBILITY[item.route] !== false);

  const normalizeRoute = (route) => {
    if (String(route || '').startsWith('works')) return 'works';
    return NAV_ITEMS.some((item) => item.route === route) ? route : 'home';
  };

  const routeFromLocation = () => normalizeRoute(location.hash.replace(/^#/, '').split(/[/?]/)[0]);

  class WineSiteHeader extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready === 'true') return;

      this.innerHTML = `
        <header class="site-header">
          <a class="brand-cn" href="#" aria-label="温酒设计有瘾">
            <img src="./assets/header-cn-logo.jpg" alt="温酒·设计有瘾" />
          </a>

          <a class="signature" href="#" aria-label="Wine Studio">
            <img src="./assets/signature.png" alt="Wine Studio — hooked on design, high on clarity" />
            <span class="signature__ghost">WINE JOY Studio.</span>
            <span class="signature__tagline">hooked on design. high on clarity.</span>
          </a>

          <nav class="nav" aria-label="主导航">
            ${visibleNavItems().map((item) => `
              <a
                class="nav__link nav__link--asset nav__link--${item.route}"
                data-label="${item.label}"
                data-route="${item.route}"
                href="#${item.route}"
              ><span>${item.label}</span><img src="${item.selectedAsset}" alt="" /></a>
            `).join('')}
          </nav>
        </header>

        <div class="rule rule--left" aria-hidden="true"></div>
        <div class="rule rule--right" aria-hidden="true"></div>
        <div class="rule rule--nav-lower" aria-hidden="true"></div>
      `;

      this.dataset.ready = 'true';
      this.syncFromLocation = () => this.setActiveRoute(routeFromLocation());
      window.addEventListener('hashchange', this.syncFromLocation);
      this.syncFromLocation();
    }

    disconnectedCallback() {
      if (this.syncFromLocation) window.removeEventListener('hashchange', this.syncFromLocation);
    }

    setActiveRoute(route) {
      const activeRoute = normalizeRoute(route);
      this.querySelectorAll('.nav__link[data-route]').forEach((link) => {
        const active = link.dataset.route === activeRoute;
        link.classList.toggle('nav__link--active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }
  }

  if (!customElements.get('wine-site-header')) {
    customElements.define('wine-site-header', WineSiteHeader);
  }
})();
