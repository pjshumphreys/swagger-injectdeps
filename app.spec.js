const expect = require('chai').expect;
const injector = require('injectdeps');
const bunyan = require('bunyan');
const sinon = require('sinon');
require('sinon-as-promised');
const logger = require('./logger');

function standardBindings() {
  return injector.getContainer()
    .bindName('bunyan').toPlainObject(bunyan)
    .bindName('logger').toObject(logger)
    .bindName('app.config').toPlainObject({})
    .bindName('app.pre').toPlainObject([])
    .bindName('app.post').toPlainObject([])
    .bindName('app').toObject(require('./app'));
}

describe('app', () => {
  it('should be initialised with the provided tools', (done) => {
    const rawApp = {use: sinon.spy()};
    const engine = sinon.stub().returns(rawApp);
    const tools = Promise.resolve({swaggerMetadata: () => null});
    const router = sinon.stub().callsArg(2);
    const container = standardBindings()
      .bindName('app.engine').toPlainObject(engine)
      .bindName('swagger.tools').toPlainObject(tools)
      .bindName('swagger.router').toPlainObject(router);

    const appPromise = container.newObject('app');
    expect(appPromise).to.be.a('promise');
    appPromise
      .catch((err) => done(err))
      .then((app) => {
        expect(app).to.have.a.property('start').that.is.a('function');
        expect(rawApp.use.calledTwice);
        done();
      });
  });

  it('should not initialise the app if the swagger tools fail to load', (done) => {
    const rawApp = {use: sinon.spy()};
    const engine = sinon.stub().returns(rawApp);
    const tools = Promise.reject(Error('Bad swagger file'));
    const router = sinon.stub().callsArg(2);
    const container = standardBindings()
      .bindName('app.engine').toPlainObject(engine)
      .bindName('swagger.tools').toPlainObject(tools)
      .bindName('swagger.router').toPlainObject(router);

    const appPromise = container.newObject('app');
    expect(appPromise).to.be.a('promise');
    appPromise
      .then((app) => { console.log(app);
        done(Error('It should not initialise the app'));
      })
      .catch((err) => {
        expect(err).to.be.an('error');
        expect(engine.notCalled).to.equal(true);
        done();
      });
  });
});
