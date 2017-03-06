module.exports = require('injectdeps')(['logger'], function(logger) {
  return () => (err, req, res, next) => {
    if(!err) {
      return next();
    }

    if(!err.statusCode && err.failedValidation){
      err.statusCode = 400;
    }

    logger('swagger').error(err, 'Fell through swagger controller middleware');

    res.statusCode = res.explicitStatusCode || err.statusCode || 500;
    let message = "Internal Server Error";
    if(res.statusCode < 500) {
      message = (err instanceof Error) ? err.message : err.toString();
    }

    res.status(res.statusCode);
    res.contentType("application/json");
    res.json({
      message,
      status: res.statusCode
    });
  };
});
