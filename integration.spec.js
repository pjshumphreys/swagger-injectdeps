const injector = require('injectdeps');
const fs = require('fs');
const path = require('path');
const bunyan = require('bunyan');
const express = require('express');
const supertest = require('supertest');
const logger = require('./test/logger');

const swaggerFilePath = path.resolve(__dirname, './test/swagger.yaml');
const testController = require('./test/hello_world.controller');

function standardBindings() {
  return injector.getContainer()
    .loadPlugin(require('./plugin')({ swaggerFilePath }))
    .bindName('bunyan').toPlainObject(bunyan)
    .bindName('logger').toObject(logger)
    .bindName('app.config').toPlainObject({ prefix: 'controller.' })
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
});
