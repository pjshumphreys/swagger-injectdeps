const expect = require('chai').expect;
const injector = require('injectdeps');
const engine = require('express');
const lodash = require('lodash');
const jsYaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const bunyan = require('bunyan');
const logger = require('./logger');
const httpMocks = require('node-mocks-http');

const swaggerMetadata = require('swagger-tools/middleware/swagger-metadata');
const swaggerHelpers = require('swagger-tools/lib/helpers');
const swaggerFilepath = path.resolve(__dirname, './test/swagger.yaml');

function standardBindings() {
  return injector.getContainer()
    .bindName('_').toPlainObject(lodash)
    .bindName('path').toPlainObject(path)
    .bindName('fs').toPlainObject(fs)
    .bindName('swagger.metadata').toPlainObject(swaggerMetadata)
    .bindName('swagger.helpers').toPlainObject(swaggerHelpers)
    .bindName('js-yaml').toPlainObject(jsYaml)
    .bindName('bunyan').toPlainObject(bunyan)
    .bindName('logger').toObject(logger)
    .bindName('swagger.spec').toObject(require('./yaml-loader'))
    .bindName('swagger.tools').toObject(require('./tools'));
}

describe('metadata', () => {
  it('should return an appropriate input data coercion middleware', (done) => {
    const container = standardBindings()
      .bindName('swagger.filePath').toScalarValue(swaggerFilepath);

    const toolsPromise = container.newObject('swagger.tools').catch((err) => {
      container.newObject('logger')('test').error(err);

      done(err);
    }).then((tools) => {
      expect(tools).to.have.a.property('swaggerMetadata');

      const request = httpMocks.createRequest({
          method: 'GET',
          url: '/hello',
          query: {
            name: 'test',
            age: 10
          }
      });

      tools.swaggerMetadata()(request, httpMocks.createResponse(), function() {
        expect(request).to.have.a.property('swagger');
        expect(request.swagger).to.have.a.property('apiPath').that.equals('/hello');
        expect(request.swagger.params.name).to.have.a.property('value').that.equals('test');
        expect(request.swagger.params.location).to.have.a.property('value').to.be.undefined;
        expect(request.swagger.params).to.not.have.a.property('age');

        done();
      });
    });
  });

  it('should not add a swagger property to a route not specified in the yaml file', (done) => {
    const container = standardBindings()
      .bindName('swagger.filePath').toScalarValue(swaggerFilepath);

    container.newObject('swagger.tools').then((tools) => {
      const request = httpMocks.createRequest({
          method: 'GET',
          url: '/hellohello',
          query: {
            name: 'test',
            age: 10
          }
      });

      tools.swaggerMetadata()(request, httpMocks.createResponse(), function() {
        expect(request).to.not.have.a.property('swagger');

        done();
      });
    });
  });
});
