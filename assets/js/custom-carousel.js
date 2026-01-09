/**
 * Custom Carousel System - Material Design Compatible
 * Manages multiple carousels on the same page independently
 */

class CustomCarousel {
  constructor(carouselId) {
    this.carouselElement = document.getElementById(carouselId);
    if (!this.carouselElement) {
      console.error(`Carousel with ID "${carouselId}" not found`);
      return;
    }
    
    this.carouselId = carouselId;
    this.currentIndex = 0;
    this.items = this.carouselElement.querySelectorAll('.carousel-item');
    this.indicators = this.carouselElement.querySelectorAll('.carousel-indicators button');
    this.prevBtn = this.carouselElement.querySelector('.carousel-control-prev');
    this.nextBtn = this.carouselElement.querySelector('.carousel-control-next');
    
    this.init();
  }

  init() {
    if (this.items.length === 0) {
      console.warn(`Carousel "${this.carouselId}" has no items`);
      return;
    }

    // Set up event listeners for prev/next buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }

    // Set up indicator buttons
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goToSlide(index));
    });

    // Show first slide
    this.showSlide(0);
  }

  showSlide(index) {
    // Validate index
    if (index < 0) {
      this.currentIndex = this.items.length - 1;
    } else if (index >= this.items.length) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = index;
    }

    // Hide all items
    this.items.forEach((item, i) => {
      item.classList.remove('active');
      if (this.indicators[i]) {
        this.indicators[i].classList.remove('active');
      }
    });

    // Show current item
    this.items[this.currentIndex].classList.add('active');
    if (this.indicators[this.currentIndex]) {
      this.indicators[this.currentIndex].classList.add('active');
    }
  }

  next() {
    this.showSlide(this.currentIndex + 1);
  }

  prev() {
    this.showSlide(this.currentIndex - 1);
  }

  goToSlide(index) {
    this.showSlide(index);
  }
}

// Initialize all carousels when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Find all carousel elements and initialize them
  const carousels = document.querySelectorAll('.carousel[id]');
  carousels.forEach(carousel => {
    new CustomCarousel(carousel.id);
  });
});
