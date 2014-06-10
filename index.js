if(typeof define === 'function' && (define.amd || define.cmd)) {
  define(function(require, exports, module) {
    module.exports = require('./web/Jsdc');
  });
}
else {
  module.exports = require('./src/Jsdc');
}