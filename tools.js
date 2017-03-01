module.exports = require('injectdeps')(
['_', 'yamlSpec', 'swaggerMetadata', 'swaggerHelpers', 'js-yaml', 'logger'],
function(_, yamlSpec, swaggerMetadataModule, swaggerHelpersModule, jsYamlModule, logger) {
  const log = logger('swagger.app');

  function initSwaggerTools(spec, rlOrSO, callback) {
    spec.validate.call(spec, rlOrSO, validateCallback.bind({ rlOrSO, callback }));
  }

  function validateCallback(err, results) {
    if (results && numberOfErrors(results) > 0) {
      err = new Error('Swagger document(s) failed validation so the server cannot start');
      err.results = results;
    }

    log.debug('Validation: %s', err ? 'failed' : 'succeeded');

    if(err) {
      this.callback(err);
    }
    else {
      this.callback(null, {
        swaggerMetadata: () => swaggerMetadataModule(this.rlOrSO)
      });
    }
  }

  function reduceInInitSwaggerTools(count, apiDeclaration) {
    return count += (apiDeclaration ? apiDeclaration.errors.length : 0);
  }

  function numberOfErrors(results) {
    return results.errors.length + _.reduce(results.apiDeclarations || [], reduceInInitSwaggerTools, 0);
  }

  function onSwaggerSpecError(err) {
    if (err.failedValidation === true) {
      swaggerHelpersModule.printValidationResults(spec.version, rlOrSO, undefined, results, true);
    } else {
      log.error('Error initializing middleware');
      log.error(err.stack);
    }
  }

  return new Promise(function(resolve, reject) {
    const swaggerSpecification = jsYamlModule.safeLoad(yamlSpec);
    const spec = swaggerHelpersModule.getSpec(swaggerHelpersModule.getSwaggerVersion(swaggerSpecification), true);

    log.info('Identified Swagger version: %s', spec.version);

    initSwaggerTools(spec, swaggerSpecification, function (err, tools) {
      if(err) {
        onSwaggerSpecError(err);
        reject(err);
      }
      else {
        resolve(tools);
      }
    });
  });
});
