module.exports = require('injectdeps')(['container', 'logger'], function(container, logger) {
  return params => {
    params = params || {};

    var log = logger('swagger');

    return (req, res, next) => {
      const methodAndPath = `${req.method} ${req.path}`;
      // First check if the path is supported by our swagger definition
      // Note that we're assuming that another module has checked this and decorated the request object
      // The basic implementation is the swagger-tools/metadata middleware exposed through the tools module
      if(!req.swagger || !req.swagger.operation) {
        let err = new Error(`Unsupported endpoint ${methodAndPath}`);
        err.statusCode = 404;
        return next(err);
      }

      const controllerName = req.swagger.path['x-swagger-router-controller'];

      if(!controllerName) {
        return next(new Error(`Swagger specification does not specify a controller for ${methodAndPath}`));
      }

      const fullControllerName = (params.prefix || '') + controllerName;

      if(!container.hasObject(fullControllerName)) {
        return next(new Error(`Could not find controller ${fullControllerName}`));
      }

      let controller;
      try {
        controller = container.getObject(fullControllerName);
      }
      catch(err) {
        return next(err);
      }

      const methodName = req.swagger.operation.operationId;
      if(!methodName) {
        return next(new Error(`Swagger specification does not specify an operationId for ${methodAndPath}`));
      }

      log.debug('Forwarding request %s to %s.%s', methodAndPath, controllerName, methodName);

      if(!controller.hasOwnProperty(methodName) || typeof controller[methodName] !== 'function'){
        return next(new Error(`Controller ${fullControllerName} doesn't handle operation ${methodName}`));
      }

      const nextHandler = (maybeError) => {
        if(maybeError) {
          next(maybeError);
        }

        next(); // always call next
      };

      const fakeResponse = {
        json(returnedObject) {
          return res.contentType('application/json').json(returnedObject);
        }
      };

      try {
        const handlerResponse = controller[methodName](req, fakeResponse, nextHandler);

        if(typeof handlerResponse !== 'undefined') {
          if(handlerResponse.then && typeof handlerResponse.then === 'function') {
            handlerResponse.then(result => {
              res.json(result);
              next();
            });

            if(handlerResponse.catch && typeof handlerResponse.catch === 'function') {
              handlerResponse.catch(next);
            }
          }
          else {
            res.json(handlerResponse);
            next();
          }
        }
      }
      catch (err) {
        // catch unhandled errors
        return next(err);
      }
    };
  };
});
