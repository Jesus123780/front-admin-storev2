// __mocks__/pkg-components-mock.js
module.exports = new Proxy({}, {
  get: () => () => {},
})
