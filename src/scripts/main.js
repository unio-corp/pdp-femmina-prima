document.addEventListener('DOMContentLoaded', () => {
  console.log('PDP loaded');

  // Initialize sections
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    section.style.minHeight = '100vh';
  });
});
