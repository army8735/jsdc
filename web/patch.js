define(function(require, exports, module){var fs = require('fs');

function stripBOM (content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}
function stripShebang (content) {
  return content.replace(/^\#\!.*/, '');
}

function hasNativeGenerators () {
  var has = false;
  try {
    eval('(function*(){})');
    has = true;
  } catch (e) {
  }
  return has;
}
function isPatched () {
  return 'JsdcJsExtensionCompiler' == require.extensions['.js'].name;
}

var origin = require.extensions && require.extensions['.js'];

module.exports = function(Jsdc, flag) {
  function JsdcJsExtensionCompiler(module, filename) {
    var content = fs.readFileSync(filename, 'utf8');
    content = stripBOM(content);
    content = stripShebang(content);

    content = Jsdc.parse(content);
    module._compile(content, filename);
  }
  if(flag) {
    if(!hasNativeGenerators() && !isPatched()) {
      require('es6-shim');
      require.extensions['.js'] = JsdcJsExtensionCompiler;
    }
  }
  else {
    require.extensions['.js'] = origin;
  }
};});