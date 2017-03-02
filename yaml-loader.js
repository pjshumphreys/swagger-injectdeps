module.exports = require('injectdeps')(
['fs', 'js-yaml', 'swagger.filePath'],
function(fs, jsYaml, swaggerFilePath) {
  return jsYaml.safeLoad(fs.readFileSync(swaggerFilePath, 'utf8'));
});
