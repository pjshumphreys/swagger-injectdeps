const expect = require('chai').expect;
const injector = require('injectdeps');
const bunyan = require('bunyan');
const logger = require('./test/logger');
const sinon = require('sinon');
require('chai').use(require('sinon-chai'));
const httpMocks = require('node-mocks-http');

function standardBindings() {
  return injector.getContainer()
    .bindName('container').toContainer()
    .bindName('bunyan').toPlainObject(bunyan)
    .bindName('logger').toObject(logger)
    .bindName('router').toObject(require('./router'));
}

function helloRequestNoSwagger(){
  return httpMocks.createRequest({
    method: 'GET',
    url: '/hello',
  });
}

function helloRequestWithSwagger() {
  let req = helloRequestNoSwagger();
  req.swagger = {
    path:{
      "x-swagger-router-controller": "helloWorld"
    },
    operation: {
      operationId: 'hello'
    }
  };
  return req;
}

describe('router', () => {
  it('should call the handler for a valid path', (done) => {
    const controller = { hello: sinon.stub().callsArg(2) };
    const container = standardBindings()
      .bindName('controller.helloWorld').toPlainObject(controller);

    const request = helloRequestWithSwagger();

    const router = container.newObject('router')({ prefix: 'controller.' });
    router(request, httpMocks.createResponse(), function(err) {
      if (err) {
        return done(err);
      }

      expect(controller.hello).to.have.been.calledOnce;
      done();
    });
  });

  it('should call next() with an error if the path is not supported', (done) => {
    const controller = { hello: sinon.stub().callsArg(2) };
    const container = standardBindings()
      .bindName('controller.helloWorld').toPlainObject(controller);

    const request = helloRequestNoSwagger();
    const response = httpMocks.createResponse();

    const router = container.newObject('router')({ prefix: 'controller.' });
    router(request, response, function(err) {
      expect(err).to.be.an('error');
      expect(controller.hello).to.not.have.been.called;
      expect(response.statusCode).to.equal(404);
      done();
    });
  });

  it('should call next() with an error if the controller is not found', (done) => {
    const controller = { hello: sinon.stub().callsArg(2) };
    const container = standardBindings();

    const request = helloRequestWithSwagger();
    const response = httpMocks.createResponse();

    const router = container.newObject('router')({ prefix: 'controller.' });
    router(request, response, function(err) {
      expect(err).to.be.an('error');
      expect(controller.hello).to.not.have.been.called;
      done();
    });
  });

  it('should call next() with an error if the operationId is not supported', (done) => {
    const controller = { hello: true };
    const container = standardBindings()
      .bindName('controller.helloWorld').toPlainObject(controller);

    const request = helloRequestWithSwagger();

    const router = container.newObject('router')({ prefix: 'controller.' });
    router(request, httpMocks.createResponse(), function(err) {
      expect(err).to.be.an('error');
      done();
    });
  });
});
