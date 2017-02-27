module.exports = require('injectdeps')(
  ['app.config.port','app.engine', 'app.pre', 'app.post', 'logger'], 
  function(port, engine, swaggerRoutes, pre, post){
    
  var log = logger('swagger.app');
    
  this.app = engine();
  
  for(middleware in pre){
    app.use(middleware);
  }

  Router r = koaRouter();
  for(route in swaggerFile){
    r.get(route.path, function(req, res, next){
      injector.getObject('controller.'+route.controller).handle(req,res);
    });
  }
  
  app.use(swaggerRoutes);

  for(middleware in pos){
    app.use(middleware);
  }
  
  this.start = function(){
    app.listen(port);
  };
  
  return this;
});
