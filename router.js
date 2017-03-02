module.exports = require('injectdeps')(['container', 'logger'], function(container, logger) {
  return params => {
    params = params || {};

    return (request, response, next) => {
      const methodAndPath = `${request.method} ${request.path}`;
      // First check if the path is supported by our swagger definition
      // Note that we're assuming that another module has checked this and decorated the request object
      // The basic implementation is the swagger-tools/metadata middleware exposed through the tools module
      if(!request.swagger || !request.swagger.operation) {
        response.statusCode = 404;
        return next(new Error(`Unsupported endpoint ${methodAndPath}`));
      }

      const controllerName = request.swagger['x-swagger-router-controller'];

      if(!controllerName) {
        return next(new Error(`Swagger specification does not specify a controller for ${methodAndPath}`));
      }

      const fullControllerName = (params.prefix || '') + controllerName;
      let controller;
      try {
        controller = container.getObject(fullControllerName);
      }
      catch (err) {
        return next(new Error(`Could not find controller ${fullControllerName}`));
      }

      const methodName = request.swagger.operation.operationId;
      if(!methodName) {
        return next(new Error(`Swagger specification does not specify an operationId for ${methodAndPath}`));
      }

      if(!controller.hasOwnProperty(methodName) || typeof controller[methodName] !== 'function'){
        return next(new Error(`Controller ${fullControllerName} can't handle operation ${methodName}`));
      }

      const nextHandler = (maybeError) => {
        if(maybeError) {
          next(maybeError);
        }

        next(); // always call next
      };

      try {
        controller[methodName](request, response, nextHandler);
      }
      catch (err) {
        // catch unhandled errors
        return next(err);
      }
    };
  };
});
