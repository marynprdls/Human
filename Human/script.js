const carousel = document.getElementById('carouselTextoImagen');

// Cuando termina el cambio de slide
carousel.addEventListener('slid.bs.carousel', function () {
  const activeItem = carousel.querySelector('.carousel-item.active');
  const texts = activeItem.querySelectorAll('.animated-text');
  
  texts.forEach(el => {
    el.classList.remove('fade-in', 'slide-in-left'); // reset
    void el.offsetWidth; // reflow para reiniciar animación
    el.classList.add('slide-in-left'); // aplicar animación
  });
});
