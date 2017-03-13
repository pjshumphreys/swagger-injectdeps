module.exports = require('injectdeps')(
['_', 'swagger.spec', 'swagger.metadata', 'swagger.helpers', 'logger'],
function(_, swaggerSpecification, swaggerMetadataModule, swaggerHelpersModule, logger) {
  const log = logger('swagger.app');
  let apiDocsCache = null;

  function initSwaggerTools(spec, rlOrSO, callback) {
    spec.validate.call(spec, rlOrSO, validateCallback.bind({ rlOrSO, callback }));
  }

  function validateCallback(err, results) {
    if (results && hasErrors(results)) {
      err = new Error('Swagger document(s) failed validation so the server cannot start');
      err.results = results;
    }

    log.debug('Validation: %s', err ? 'failed' : 'succeeded');

    apiDocsCache = JSON.stringify(this.rlOrSO, null, 2);

    if (err) {
      this.callback(err);
    }
    else {
      this.callback(null, {
        swaggerMetadata: () => swaggerMetadataModule(this.rlOrSO),
        apiDocsJson: () => apiDocsCache,
      });
    }
  }

  function reduceInHasErrors(count, apiDeclaration) {
    return count += (apiDeclaration ? apiDeclaration.errors.length : 0);
  }

  function hasErrors(results) {
    return results.errors.length + _.reduce(results.apiDeclarations || [], reduceInHasErrors, 0) > 0;
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
