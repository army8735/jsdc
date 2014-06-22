define(function(require, exports, module) {
  var events = {};
  
  // Bind event
  exports.on = function(name, callback) {
    var list = events[name] || (events[name] = []);
    list.push(callback);
    return exports;
  }
  
  // Remove event. If `callback` is undefined, remove all callbacks for the
  // event. If `event` and `callback` are both undefined, remove all callbacks
  // for all events
  exports.off = function(name, callback) {
    // Remove *all* events
    if(!(name || callback)) {
      events = {};
      return exports;
    }
  
    var list = events[name];
    if(list) {
      if(callback) {
        for(var i = list.length - 1; i >= 0; i--) {
          if(list[i] === callback) {
            list.splice(i, 1);
          }
        }
      }
      else {
        delete events[name];
      }
    }
  
    return exports;
  }
  
  // Emit event, firing all bound callbacks. Callbacks receive the same
  // arguments as `emit` does, apart from the event name
  exports.emit = function(name, data) {
    var list = events[name];
  
    if(list) {
      // Copy callback lists to prevent modification
      list = list.slice();
  
      // Execute event callbacks, use index because it's the faster.
      for(var i = 0, len = list.length; i < len; i++) {
        list[i].apply(exports, data);
      }
    }
  
    return exports;
  }
});