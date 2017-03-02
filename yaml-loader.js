module.exports = require('injectdeps')(
['fs', 'js-yaml', 'swaggerFilePath'],
function(fs, jsYaml, swaggerFilePath) {
  return jsYaml.safeLoad(fs.readFileSync(swaggerFilePath, 'utf8'));
});
