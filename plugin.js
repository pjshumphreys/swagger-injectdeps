'use strict';
const path = require('path');

/* Wraps most of the internal binding as a plugin */

module.exports = (settings) => (container) => {
  const config = settings || {};
  const swaggerFilePath = config.swaggerFilePath || path.resolve(__dirname, './api/swagger/swagger.yaml');
  return (container ? container : require('injectdeps').getContainer())
    .bindName('container').toContainer()
    .bindName('fs').toPlainObject(require('fs'))
    .bindName('path').toPlainObject(path)
    .bindName('_').toPlainObject(require('lodash'))
    .bindName('app.engine').toPlainObject(require('express'))
    .bindName('swagger.filePath').toScalarValue(swaggerFilePath)
    .bindName('js-yaml').toPlainObject(require('js-yaml'))
    .bindName('swagger.tools').toObject(require('./tools'))
    .bindName('swagger.helpers').toPlainObject(require('swagger-tools/lib/helpers'))
    .bindName('swagger.metadata').toPlainObject(require('swagger-tools/middleware/swagger-metadata'))
    .bindName('swagger.validator').toPlainObject(require('swagger-tools/middleware/swagger-validator'))
    .bindName('swagger.spec').toObject(require('./yaml-loader'))
    .bindName('swagger.router').toObject(require('./router'))
    .bindName('app.errorHandler').toObject(require('./error-handler'))
    .bindName('app').toObject(require('./app'));
};