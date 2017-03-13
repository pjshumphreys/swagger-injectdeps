const expect = require('chai').expect;
const injector = require('injectdeps');
const bunyan = require('bunyan');
const sinon = require('sinon');
require('chai').use(require('sinon-chai'));
const logger = require('./test/logger');
const rawRouter = (req,res,next) => next();
const mockValidator = ()=>(req,res,next)=>next();
const errorHandler = ()=>()=>{};

function standardBindings() {
  return injector.getContainer()
    .bindName('bunyan').toPlainObject(bunyan)
    .bindName('logger').toObject(logger)
    .bindName('app.config').toPlainObject({})
    .bindName('container').toContainer()
    .bindName('app.errorHandler').toPlainObject(errorHandler())
    .bindName('swagger.validator').toPlainObject(mockValidator)
    .bindName('app').toObject(require('./app'));
}

describe('app', () => {
  it('should be initialised with the provided tools', (done) => {
    const router = sinon.stub().returns(rawRouter);
    const rawApp = {
      get: sinon.spy(),
      use: sinon.spy(),
      listen: sinon.spy()
    };
    const engine = sinon.stub().returns(rawApp);
    const tools = Promise.resolve({swaggerMetadata: () => null});
    const container = standardBindings()
      .bindName('swagger.tools').toPlainObject(tools)
      .bindName('app.engine').toPlainObject(engine)
      .bindName('swagger.router').toPlainObject(router);

    const appPromise = container.newObject('app');
    expect(appPromise).to.be.a('promise');

    appPromise
      .then((app) => {
        expect(router).to.have.been.calledOnce;
        expect(app).to.have.a.property('listen').that.is.a('function');
        // use was used once for swagger-metadata,
        // once for swagger-validation and once for the router
        expect(rawApp.use).to.have.been.callCount(4);
        expect(rawApp.get).to.have.been.calledOnce;
        done();
      })
      .catch((err) => done(err));
  });

  it('should not initialise the app if the swagger tools fail to load', (done) => {
    const router = sinon.stub().returns(rawRouter);
    const rawApp = {
      use: sinon.spy(),
      listen: sinon.spy()
    };
    const engine = sinon.stub().returns(rawApp);
    const tools = Promise.reject(Error('Bad swagger file'));
    const container = standardBindings()
      .bindName('swagger.tools').toPlainObject(tools)
      .bindName('app.engine').toPlainObject(engine)
      .bindName('swagger.router').toPlainObject(router);

    const appPromise = container.newObject('app');
    expect(appPromise).to.be.a('promise');

    appPromise
      .then(() => {
        done(Error('It should not initialise the app'));
      })
      .catch((err) => {
        expect(err).to.be.an('error');
        expect(engine).to.have.not.been.called;
        done();
      });
  });
});
