module.exports = require('injectdeps')(['bunyan'], function(bunyan) {
  return name => bunyan.createLogger({
    name: name,
    level: 'debug',
    serializers: bunyan.stdSerializers,
    stream: process.stdout,
  });
});

