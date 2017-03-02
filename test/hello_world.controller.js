module.exports = require('injectdeps')([], function() {
  this.hello = function(req, res) {
    res.json({
      message: `hello from ${req.swagger.params.name.value}`
    });
  };

  return this;
});

