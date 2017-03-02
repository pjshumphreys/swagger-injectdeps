module.exports = require('injectdeps')(
  ['app.engine', 'swagger.tools', 'swagger.validator', 'swagger.router',
    'app.errorHandler', 'app.config', 'app.pre', 'app.post', 'logger'],
  function(engine, swaggerTools, swaggerValidator, swaggerRouter, errorHandler, config, pre, post, logger) {
    const log = logger('swagger.app');

    return swaggerTools
      .then((tools) => {
        const app = engine(config);

        app.use(tools.swaggerMetadata());
        app.use(swaggerValidator());

        for(let middleware in pre) {
          app.use(middleware);
        }

        app.use(swaggerRouter({ prefix: config.prefix }));

        for(let middleware in post) {
          app.use(middleware);
        }

        app.use(errorHandler());

        return app;
      })
      .catch(err => {
        log.error(err, 'app failed to start');

        return Promise.reject(err);
      });
});
