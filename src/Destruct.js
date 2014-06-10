var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');
var Token = homunculus.getClass('Token');

var Class = require('./util/Class');

var Destruct = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.hash = {};
  this.idCache = {};
}).methods({
  parse: function(node, start) {
    //
  },
  getIds: function(node) {
    if(this.idCache.hasOwnProperty(node.nid())) {
      return this.idCache[node.nid()];
    }
    this.jsdc.ignore(node);
    var res = { arr: [] };
    this.recursion(node, res);
    this.idCache[node.nid()] = res.arr;
    return res.arr;
  },
  recursion: function(node, res) {
    var self = this;
    var rec = false;
    switch(node.name()) {
      case JsNode.ARRBINDPAT:
        res.arr = res.arr.concat(this.arrbindpat(node));
        rec = true;
        break;
      case JsNode.OBJBINDPAT:
        res.arr = res.arr.concat(this.objbindpat(node));
        rec = true;
        break;
      case JsNode.BINDELEM:
      case JsNode.BINDPROPT:
        rec = true;
        break;
    }
    rec && node.leaves().forEach(function(leaf) {
      self.recursion(leaf, res);
    });
  },
  arrbindpat: function(node) {
    if(this.idCache.hasOwnProperty(node.nid())) {
      return this.idCache[node.nid()];
    }
    var res = [];
    node.leaves().forEach(function(leaf) {
      if(leaf.name() == JsNode.SINGLENAME) {
        res.push(leaf.first().first().token().content());
      }
    });
    this.idCache[node.nid()] = res;
    return res;
  },
  objbindpat: function(node) {
    if(this.idCache.hasOwnProperty(node.nid())) {
      return this.idCache[node.nid()];
    }
    var res = [];
    node.leaves().forEach(function(leaf) {
      if(leaf.name() == JsNode.BINDPROPT) {
        var first = leaf.first();
        if(first.name() == JsNode.SINGLENAME) {
          res.push(first.first().first().token().content());
        }
      }
    });
    this.idCache[node.nid()] = res;
    return res;
  },
  decl: function(node, start) {
    var first = node.first();
    var self = this;
    switch(first.name()) {
      case JsNode.ARRBINDPAT:
        if(start) {
          self.jsdc.append('!function(){var ');
          var temp = self.jsdc.uid();
          self.hash[first.nid()] = temp;
          self.jsdc.append(temp);
        }
        else {
          self.jsdc.appendBefore(';');
          var temp = self.hash[first.nid()];
          var target = self.getArray(first.leaves());
          target.forEach(function(leaf, i) {
            switch(leaf.name()) {
              case JsNode.SINGLENAME:
                var id = leaf.first().first().token().content();
                self.jsdc.appendBefore(id + '=' + temp + '[' + i + '];');
                break;
              case JsNode.BINDELEM:
                self.destruct(leaf.first(), {
                  temp: temp,
                  index: i
                });
                break;
            }
          });
          self.jsdc.appendBefore('}()');
        }
        break;
      case JsNode.OBJBINDPAT:
        if(start) {
          self.jsdc.append('!function(){var ');
          var temp = self.jsdc.uid();
          self.hash[first.nid()] = temp;
          self.jsdc.append(temp);
        }
        else {
          self.jsdc.appendBefore(';');
          var temp = self.hash[first.nid()];
          var target = self.getName(first.leaves());
          target.forEach(function(leaf) {
            leaf = leaf.first();
            switch(leaf.name()) {
              case JsNode.SINGLENAME:
                var id = leaf.first().first().token().content();
                self.jsdc.appendBefore(id + '=' + temp + '["' + id + '"];');
                break;
              case JsNode.PROPTNAME:
                var last = leaf.next().next();
                var name = leaf.first().first().token().content();
                switch(last.name()) {
                  case JsNode.SINGLENAME:
                    var id = last.first().first().token().content();
                    self.jsdc.appendBefore(id + '=' + temp + '["' + name + '"];');
                    break;
                  case JsNode.BINDELEM:
                    self.destruct(last.first(), {
                      temp: temp,
                      name: name,
                      index: 0
                    });
                    break;
                }
                break;
            }
          });
          self.jsdc.appendBefore('}()');
        }
        break;
    }
  },
  destruct: function(node, data) {
    var self = this;
    switch(node.name()) {
      case JsNode.ARRBINDPAT:
        self.jsdc.appendBefore('!function(){var ');
        var temp = self.jsdc.uid();
        if(data.name) {
          self.jsdc.appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
        }
        else {
          self.jsdc.appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
        }
        var target = self.getArray(node.leaves());
        target.forEach(function(leaf, i) {
          switch(leaf.name()) {
            case JsNode.SINGLENAME:
              var id = leaf.first().first().token().content();
              self.jsdc.appendBefore(id + '=' + temp + '[' + i + '];');
              break;
            case JsNode.BINDELEM:
              self.destruct(leaf.first(), {
                temp: temp,
                index: i
              });
              break;
          }
        });
        self.jsdc.appendBefore('}();');
        break;
      case JsNode.OBJBINDPAT:
        self.jsdc.appendBefore('!function(){var ');
        var temp = self.jsdc.uid();
        if(data.name) {
          self.jsdc.appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
        }
        else {
          self.jsdc.appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
        }
        var target = self.getArray(node.leaves());
        target.forEach(function(leaf) {
          leaf = leaf.first();
          switch(leaf.name()) {
            case JsNode.SINGLENAME:
              var id = leaf.first().first().token().content();
              self.jsdc.appendBefore(id + '=' + temp + '["' + id + '"];');
              break;
            case JsNode.PROPTNAME:
              var last = leaf.next().next();
              var name = leaf.first().first().token().content();
              switch(last.name()) {
                case JsNode.SINGLENAME:
                  var id = last.first().first().token().content();
                  self.jsdc.appendBefore(id + '=' + temp + '["' + name + '"];');
                  break;
                case JsNode.BINDELEM:
                  self.destruct(last.first(), {
                    temp: temp,
                    name: name,
                    index: 0
                  });
                  break;
              }
              break;
          }
        });
        self.jsdc.appendBefore('}();');
        break;
    }
  },
  getArray: function(leaves) {
    leaves = leaves.slice(1, leaves.length - 1);
    var target = [];
    for(var i = 0; i < leaves.length; i++) {
      var leaf = leaves[i];
      if(leaf.name() == JsNode.TOKEN) {
        if(!leaf.prev()
          || leaf.prev().name() == JsNode.TOKEN) {
          target.push(leaf);
        }
      }
      else {
        target.push(leaf);
      }
    }
    return target;
  },
  getName: function(leaves) {
    return leaves.filter(function(leaf, i) {
      return i % 2 == 1;
    });
  }
});

module.exports = Destruct;
