define(function(require, exports, module){function inheritPrototype(subType, superType) {
  var prototype = Object.create(superType.prototype);
  prototype.constructor = subType;
  subType.prototype = prototype;
  //继承static变量
  Object.keys(superType).forEach(function(k) {
    subType[k] = superType[k];
  });
  return subType;
}
function wrap(fn) {
  fn.extend = function(sub) {
    inheritPrototype(sub, fn);
    return wrap(sub);
  }
  fn.methods = function(o) {
    Object.keys(o).forEach(function(k) {
      fn.prototype[k] = o[k];
    });
    return fn;
  };
  fn.statics = function(o) {
    Object.keys(o).forEach(function(k) {
      fn[k] = o[k];
    });
    return fn;
  };
  return fn;
}
function klass(cons) {
  return wrap(cons || function() {});
}
klass.extend = inheritPrototype;
module.exports = klass;});