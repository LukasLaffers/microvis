/*
 * Microvis: the light / dark switch in the top right corner of every page.
 * Without a choice the page follows the system setting. A click switches to the other theme and remembers it
 * (localStorage) for all pages; an inline line in each <head> applies the remembered choice before the page
 * is drawn, so there is no flash. Figures redraw through the "microvis-theme" event (see shared/ui.js).
 */
(function (root) {
  'use strict';
  const KEY = 'microvis-theme';
  const html = document.documentElement;
  const systemDark = () => !!(root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches);
  const isDark = () => html.dataset.theme ? html.dataset.theme === 'dark' : systemDark();

  // Start-page previews: pick the light or dark picture to match the page, not only the system.
  function syncPictures() {
    const dark = isDark();
    document.querySelectorAll('picture source[data-dark]').forEach(s => { s.media = dark ? 'all' : 'not all'; });
    document.querySelectorAll('picture source[media="(prefers-color-scheme: dark)"]').forEach(s => {
      s.setAttribute('data-dark', ''); s.media = dark ? 'all' : 'not all';
    });
  }

  function update() {
    const dark = isDark();
    document.querySelectorAll('.theme-toggle').forEach(b => {
      b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      b.title = dark ? 'Light mode' : 'Dark mode';
      b.setAttribute('aria-pressed', String(dark));
    });
    syncPictures();
  }

  function toggle() {
    const next = isDark() ? 'light' : 'dark';
    html.dataset.theme = next;
    try { root.localStorage.setItem(KEY, next); } catch (e) { /* private mode: the switch still works on this page */ }
    update();
    root.dispatchEvent(new root.Event('microvis-theme'));
  }

  function init() {
    document.querySelectorAll('.theme-toggle').forEach(b => b.addEventListener('click', toggle));
    update();
    if (root.matchMedia) {
      const mq = root.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', update);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
