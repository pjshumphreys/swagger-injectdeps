module.exports = require('injectdeps')(
['swagger.spec', 'swagger.metadata', 'swagger.helpers', 'logger'],
function(swaggerSpecification, swaggerMetadataModule, swaggerHelpersModule, logger) {
  const log = logger('swagger.app');

  function initSwaggerTools(spec, rlOrSO, callback) {
    spec.validate.call(spec, rlOrSO, validateCallback.bind({ rlOrSO, callback }));
  }

  function validateCallback(err, results) {
    if (results && hasErrors(results)) {
      err = new Error('Swagger document(s) failed validation so the server cannot start');
      err.results = results;
    }

    log.debug('Validation: %s', err ? 'failed' : 'succeeded');

    if (err) {
      this.callback(err);
    }
    else {
      this.callback(null, {
        swaggerMetadata: () => swaggerMetadataModule(this.rlOrSO),
        apiDocsJson: () => JSON.stringify(this.rlOrSO, null, 2),
      });
    }
  }

  function hasErrors(results) {
    let errorCount = results.errors.length;
    const apiDeclarations = results.apiDeclarations || [];
    const len = apiDeclarations.length;

    for(let i = 0; i < len; i++) {
      errorCount += apiDeclarations[i].errors.length;
    }

    return errorCount > 0;
  }

  function onSwaggerSpecError(err, specVersion, spec) {
    if (err.failedValidation === true) {
      swaggerHelpersModule.printValidationResults(specVersion, spec, undefined, err.results, true);
    }
    else {
      log.error('Error initializing middleware');
      log.error(err.stack);
    }
  }

  return new Promise(function(resolve, reject) {
    const spec = swaggerHelpersModule.getSpec(swaggerHelpersModule.getSwaggerVersion(swaggerSpecification), true);

    log.info('Identified Swagger version: %s', spec.version);

    initSwaggerTools(spec, swaggerSpecification, function (err, tools) {
      if (err) {
        onSwaggerSpecError(err, spec.version, spec);
        reject(err);
      }
      else {
        resolve(tools);
      }
    });
  });
});
