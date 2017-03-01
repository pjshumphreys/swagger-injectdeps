module.exports = require('injectdeps')(['fs', 'path', 'js-yaml', 'swaggerFilePath'],
  function(fs, path, jsYaml, swaggerFilePath) {
  const swaggerStr = fs.readFileSync(path.resolve(swaggerFilePath), 'utf8');
  return jsYaml.safeLoad(swaggerStr);
});