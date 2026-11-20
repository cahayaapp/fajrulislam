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

// Manual navigation keeps each family story readable without timed changes.
const storySlides = Array.from(document.querySelectorAll('.testimonial-slide'));
let activeStory = 0;
function changeStory(direction) {
  if (storySlides.length < 2) return;
  activeStory = (activeStory + direction + storySlides.length) % storySlides.length;
  storySlides.forEach((slide, index) => { slide.hidden = index !== activeStory; });
  document.querySelector('.story-counter').textContent = `Cerita ${activeStory + 1} dari ${storySlides.length}`;
  const photo = storySlides[activeStory].querySelector('.testimonial-photo img');
  photo.loading = 'eager';
  document.querySelector('.testimonial-stories').scrollIntoView({ behavior: 'instant', block: 'start' });
}
document.querySelector('.story-prev')?.addEventListener('click', () => changeStory(-1));
document.querySelector('.story-next')?.addEventListener('click', () => changeStory(1));
