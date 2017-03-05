module.exports = require('injectdeps')(
  [
    'app.engine',
    'swagger.tools',
    'swagger.validator',
    'swagger.router',
    'app.errorHandler',
    'app.config',
    'container',
    'logger'
  ],
  function(
      engine,
      swaggerTools,
      swaggerValidator,
      swaggerRouter,
      errorHandler,
      config,
      container,
      logger
    ) {
    const log = logger('swagger.app');

    return swaggerTools
      .then((tools) => {
        let err, pre, post;
        const app = engine(config);

        app.use(tools.swaggerMetadata());
        app.use(swaggerValidator());

        try {
          pre = container.getObject('app.pre');
          if(Array.isArray(pre)) {
            for(let middleware in pre) {
              app.use(middleware);
            }
          }
        }
        catch(err) {
          //no pre were defined. don't worry about it
        }

        app.use(swaggerRouter({ prefix: config.prefix }));

        try {
          post = container.getObject('app.post');
          if(Array.isArray(post)) {
            for(let middleware in post) {
              app.use(middleware);
            }
          }
        }
        catch(err) {
          //no pre were defined. don't worry about it
        }

        app.use(errorHandler());

        return app;
      })
      .catch(err => {
        log.error(err, 'app failed to start');

        return Promise.reject(err);
      });
  }
);
