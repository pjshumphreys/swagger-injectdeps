module.exports = require('injectdeps')(
  ['app.engine', 'swagger.tools', 'swagger.router', 'app.config', 'app.pre', 'app.post', 'logger'],
  function(engine, swaggerTools, swaggerRouter, config, pre, post, logger) {

    const log = logger('swagger.app');

    return swaggerTools
      .then((tools) => {
        const app = engine(config);

        app.use(tools.swaggerMetadata());

        for(let middleware in pre) {
          app.use(middleware);
        }

        app.use(swaggerRouter());

        for(let middleware in post){
          app.use(middleware);
        }

        return {
          app,
          start: function() {
            log.info('Starting Swagger app on port %d', port);
            app.listen();
          }
        };
      })
      .catch(err => {
        // log.error(err, 'app failed to start');

        return Promise.reject(err);
      });
});
