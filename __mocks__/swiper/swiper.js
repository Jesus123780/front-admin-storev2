// Example: __mocks__/swiper.js
const Swiper = jest.fn(() => null);
Swiper.use = jest.fn();
const SwiperSlide = jest.fn(() => null);

// Mock modules
const Navigation = {};
const Pagination = {};
const Virtual = {};

module.exports = {
  __esModule: true,
  default: Swiper,
  Swiper,
  SwiperSlide,
  Navigation,
  Pagination,
  Virtual,
};
