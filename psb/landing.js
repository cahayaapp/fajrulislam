const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
function closeMenu() {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    closeMenu();
    toggle.focus();
  }
});
window.matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);

const photoDialog = document.querySelector('.photo-dialog');
let photoTrigger;
document.querySelectorAll('[data-photo]').forEach(button => {
  button.addEventListener('click', () => {
    photoTrigger = button;
    const image = button.querySelector('img');
    photoDialog.querySelector('img').src = button.dataset.photo;
    photoDialog.querySelector('img').alt = image.alt;
    photoDialog.querySelector('p').textContent = image.alt;
    photoDialog.showModal();
  });
});
photoDialog.querySelector('.close-photo').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', event => {
  if (event.target === photoDialog) photoDialog.close();
});
photoDialog.addEventListener('close', () => photoTrigger?.focus());
