# Navigation lock

The current site header is an approved, locked public component. Its locked
boundary includes the Chinese logo, handwritten W/signature artwork and its
confirmed vertical position, supporting signature copy, all three gray header
rules and their confirmed positions, and every navigation tab state.

## Source of truth

- Structure and active-state behavior: `components/site-header.js`
- Visual styles, selected assets, hover states, sticky behavior, and responsive rules: `components/site-header.css`
- Page integration: `<wine-site-header></wine-site-header>`

## Locked contract

1. Do not change header dimensions, spacing, colors, typography, assets, the handwritten W/signature position, any of the three gray rules, hover, focus, selected states, sticky behavior, or positioning without explicit user approval.
2. New pages reuse `<wine-site-header>` and only change the active route through `setActiveRoute(route)` or the URL hash.
3. Works child routes (`works-gallery`, `works-ux`, and future `works-*` routes) normalize to the existing `works` active state.
4. Do not duplicate the header markup, W/signature styles, gray-rule styles, navigation styles, or interaction logic inside page-specific files.
5. A new navigation item may be added to `NAV_ITEMS` without changing any existing item or shared visual rule.
6. If a new page cannot use the component unchanged, explain the concrete technical reason and obtain approval before editing the component.
