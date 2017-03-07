module.exports = require('injectdeps')(['logger'], function(logger) {
  return () => (err, req, res, next) => {
    if(!err) {
      return next();
    }

    if(!err.statusCode) {
      err.statusCode = err.failedValidation ? 400 : 500;
    }

    logger('swagger').error(err, 'Fell through swagger controller middleware');

    let message = "Internal Server Error";
    if(err.statusCode < 500) {
      message = (err instanceof Error) ? err.message : err.toString();
    }

    res.status(err.statusCode);
    res.contentType("application/json");
    res.json({
      message,
      status: res.statusCode
    });
  };
});
