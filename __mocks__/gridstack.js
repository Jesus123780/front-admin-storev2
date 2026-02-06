module.exports = {
  __esModule: true,
  GridStack: {
    init: jest.fn(() => ({
      destroy: jest.fn(),
      addWidget: jest.fn(),
      removeAll: jest.fn(),
    })),
  },
};
