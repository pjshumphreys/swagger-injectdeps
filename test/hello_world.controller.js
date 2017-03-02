module.exports = require('injectdeps')([], function() {
  this.hello = function(req, res, next) {
    res.json({
      message: `hello from ${req.swagger.params.name.value}` 
    });
  };
  
  return this;
});

