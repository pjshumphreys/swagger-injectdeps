const expect = require('chai').expect;
const injector = require('injectdeps');
const lodash = require('lodash');
const jsYaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const bunyan = require('bunyan');
const express = require('express');
const supertest = require('supertest');
const logger = require('./test/logger');

const swaggerMetadata = require('swagger-tools/middleware/swagger-metadata');
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
    .bindName('app.config').toPlainObject({ prefix: 'controller.' })
    .bindName('app.pre').toPlainObject([])
    .bindName('app.post').toPlainObject([])
    .bindName('app').toObject(require('./app'))
    .bindName('swagger.metadata').toPlainObject(swaggerMetadata)
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
});
