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
    const apiDocsPath = container.hasObject('swagger.apiDocsPath') ?
        container.getObject('swagger.apiDocsPath') : '/api-docs';

    return swaggerTools
      .then((tools) => {
        let pre, post;
        const app = engine(config);

        app.get(apiDocsPath, (req, res) => {
          res.contentType('application/json')
            .send(tools.apiDocsJson());
          //do not call next, do not pass go
        });

        app.use(tools.swaggerMetadata());
        app.use(swaggerValidator());

        if(container.hasObject('app.pre')) {
          pre = container.getObject('app.pre');

          if(Array.isArray(pre)) {
            for(let i in pre) {
              app.use(pre[i]);
            }
          }
        }

        app.use(swaggerRouter({ prefix: config.prefix }));

        if(container.hasObject('app.post')) {
          post = container.getObject('app.post');

          if(Array.isArray(post)) {
            for(let u in post) {
              app.use(post[i]);
            }
          }
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
