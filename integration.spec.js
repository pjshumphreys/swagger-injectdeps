const injector = require('injectdeps');
const lodash = require('lodash');
const jsYaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const bunyan = require('bunyan');
const express = require('express');
const supertest = require('supertest');
const logger = require('./test/logger');
const expect = require('chai').expect;

const swaggerMetadata = require('swagger-tools/middleware/swagger-metadata');
const swaggerValidator = require('swagger-tools/middleware/swagger-validator');
const swaggerHelpers = require('swagger-tools/lib/helpers');
const swaggerFilepath = path.resolve(__dirname, './test/swagger.yaml');
const testController = require('./test/hello_world.controller');

function standardBindings() {
  return injector.getContainer()
    .bindName('container').toContainer()
    .bindName('fs').toPlainObject(fs)
    .bindName('path').toPlainObject(path)
    .bindName('_').toPlainObject(lodash)
    .bindName('js-yaml').toPlainObject(jsYaml)
    .bindName('bunyan').toPlainObject(bunyan)
    .bindName('logger').toObject(logger)
    .bindName('app.engine').toPlainObject(express)
    .bindName('app.errorHandler').toObject(require('./error-handler'))
    .bindName('app.config').toPlainObject({ prefix: 'controller.' })
    .bindName('app.pre').toPlainObject([])
    .bindName('app.post').toPlainObject([])
    .bindName('app').toObject(require('./app'))
    .bindName('swagger.metadata').toPlainObject(swaggerMetadata)
    .bindName('swagger.validator').toPlainObject(swaggerValidator)
    .bindName('swagger.helpers').toPlainObject(swaggerHelpers)
    .bindName('swagger.spec').toObject(require('./yaml-loader'))
    .bindName('swagger.tools').toObject(require('./tools'))
    .bindName('swagger.filePath').toScalarValue(swaggerFilepath)
    .bindName('swagger.router').toObject(require('./router'))
    .bindName('controller.hello_world').toObject(testController);
}

describe('integration', () => {
  it('should return a 200 http status for a valid request', (done) => {
    standardBindings().newObject('app').then((app) => {
      supertest(app)
        .get('/hello')
        .query({ name: 'Testy McTester' })
        .expect('Content-Type', /json/)
        .expect(200, {
          message: 'hello from Testy McTester'
        }, done);
    });
  });

  it('should return 400 if a parameter is not valid', (done) => {
    standardBindings().newObject('app').then((app) => {
      supertest(app)
        .get('/hello')
        .query({ name: 'name longer than 15 characters' })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });
  });

  it('should return the json swagger specification at /api-docs', () => {
    return standardBindings().newObject('app').then((app) => {
      return supertest(app)
        .get('/api-docs')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          console.log(response.body);
          expect(response.body).to.have.a.property('swagger').that.equals('2.0');
          expect(response.body).to.have.a.property('consumes').that.is.an('array');
          expect(response.body).to.have.a.property('info');
          expect(response.body.info).to.have.a.property('title').that.equals('Hello World App');
          expect(response.body).to.have.a.property('paths');
          expect(response.body.paths).to.have.a.property('/hello').that
            .has.a.property('x-swagger-router-controller').that.equals('hello_world');
          expect(response.body).to.have.a.property('definitions');
          expect(response.body.definitions).to.have.a.property('HelloWorldResponse').that
            .has.a.property('required').that.is.an('array');

        });
    });
  });
});
