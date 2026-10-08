'use strict';
document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
function closeMenu(restoreFocus = false) {
  nav?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) toggle?.focus();
}
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu(true);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});
// Preserve links used by the previous one-page website.
const legacy = { '#approach': 'approach/', '#observatory': 'observatory/', '#partner': 'partner/', '#contact': 'partner/' };
if (document.querySelector('.hero') && legacy[location.hash]) location.replace(legacy[location.hash]);
