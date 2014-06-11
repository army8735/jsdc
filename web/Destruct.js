define(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  var Token = homunculus.getClass('Token');
  
  var Class = require('./util/Class');
  
  var Destruct = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
    this.inAssign = {};
    this.idCache = {};
  }).methods({
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
    parse: function(node, start) {
      var self = this;
      var first = node.first();
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
              var end = i == target.length - 1;
              switch(leaf.name()) {
                case JsNode.SINGLENAME:
                  var id = leaf.first().first().token().content();
                  self.jsdc.appendBefore(id + '=' + temp + '[' + i + ']' + (end ? '' : ';'));
                  //初始化赋值
                  if(leaf.size() == 2) {
                    var init = leaf.last();
                    self.jsdc.appendBefore((end ? ';' : '') + 'if(' + id + '===void 0)')
                    self.jsdc.appendBefore(id + self.join(init) + (end ? '' : ';'));
                  }
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
            target.forEach(function(leaf, i) {
              var end = i == target.length - 1;
              leaf = leaf.first();
              switch(leaf.name()) {
                case JsNode.SINGLENAME:
                  var id = leaf.first().first().token().content();
                  self.jsdc.appendBefore(id + '=' + temp + '["' + id + '"]' + (end ? '' : ';'));
                  //初始化赋值
                  if(leaf.size() == 2) {
                    var init = leaf.last();
                    self.jsdc.appendBefore((end ? ';' : '') + 'if(' + id + '===void 0)')
                    self.jsdc.appendBefore(id + self.join(init) + (end ? '' : ';'));
                  }
                  break;
                case JsNode.PROPTNAME:
                  var last = leaf.next().next();
                  var name = leaf.first().first().token().content();
                  switch(last.name()) {
                    case JsNode.SINGLENAME:
                      var id = last.first().first().token().content();
                      self.jsdc.appendBefore(id + '=' + temp + '["' + name + '"]' + (end ? '' : ';'));
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
          self.jsdc.appendBefore('var ');
          var temp = self.jsdc.uid();
          if(data.name) {
            self.jsdc.appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
          }
          else {
            self.jsdc.appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
          }
          var target = self.getArray(node.leaves());
          target.forEach(function(leaf, i) {
            var end = i == target.length - 1;
            switch(leaf.name()) {
              case JsNode.SINGLENAME:
                var id = leaf.first().first().token().content();
                self.jsdc.appendBefore(id + '=' + temp + '[' + i + ']' + (end ? '' : ';'));
                //初始化赋值
                if(leaf.size() == 2) {
                  var init = leaf.last();
                  self.jsdc.appendBefore((end ? ';' : '') + 'if(' + id + '===void 0)')
                  self.jsdc.appendBefore(id + self.join(init) + (end ? '' : ';'));
                }
                break;
              case JsNode.BINDELEM:
                self.destruct(leaf.first(), {
                  temp: temp,
                  index: i
                });
                break;
            }
          });
          break;
        case JsNode.OBJBINDPAT:
          self.jsdc.appendBefore('var ');
          var temp = self.jsdc.uid();
          if(data.name) {
            self.jsdc.appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
          }
          else {
            self.jsdc.appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
          }
          var target = self.getArray(node.leaves());
          target.forEach(function(leaf, i) {
            var end = i == target.length - 1;
            leaf = leaf.first();
            switch(leaf.name()) {
              case JsNode.SINGLENAME:
                var id = leaf.first().first().token().content();
                self.jsdc.appendBefore(id + '=' + temp + '["' + id + '"]' + (end ? '' : ';'));
                //初始化赋值
                if(leaf.size() == 2) {
                  var init = leaf.last();
                  self.jsdc.appendBefore((end ? ';' : '') + 'if(' + id + '===void 0)')
                  self.jsdc.appendBefore(id + self.join(init) + (end ? '' : ';'));
                }
                break;
              case JsNode.PROPTNAME:
                var last = leaf.next().next();
                var name = leaf.first().first().token().content();
                switch(last.name()) {
                  case JsNode.SINGLENAME:
                    var id = last.first().first().token().content();
                    self.jsdc.appendBefore(id + '=' + temp + '["' + name + '"]' + (end ? '' : ';'));
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
          break;
      }
    },
    expr: function(assignexpr, start) {
      var self = this;
      var first = assignexpr.first();
      first = first.first();
      switch(first.name()) {
        case JsNode.ARRLTR:
          if(start) {
            this.jsdc.ignore(first);
            if(assignexpr.parent().name() == JsNode.ASSIGNEXPR) {
              self.hash[first.nid()] = self.hash[assignexpr.parent().first().first().nid()];
              this.jsdc.ignore(assignexpr.leaf(1));
            }
            else if(assignexpr.parent().name() == JsNode.INITLZ) {
              var bindpat = assignexpr.parent().prev();
              if(bindpat.name() == JsNode.ARRBINDPAT
                || bindpat.name() == JsNode.OBJBINDPAT) {
                self.hash[first.nid()] = self.hash[assignexpr.parent().prev().nid()];
                this.jsdc.ignore(assignexpr.leaf(1));
              }
              else {
                self.jsdc.append('function(){var ');
                var temp = self.jsdc.uid();
                self.hash[first.nid()] = temp;
                self.inAssign[first.nid()] = true;
                self.jsdc.append(temp);
              }
            }
            else {
              var temp = self.jsdc.uid();
              self.hash[first.nid()] = temp;
              self.jsdc.append('!function(){var ');
              self.jsdc.append(temp);
            }
          }
          else {
            self.jsdc.appendBefore(';');
            var temp = self.hash[first.nid()];
            var target = self.getArray(first.leaves());
            target.forEach(function(leaf, i) {
              if(leaf.name() == JsNode.TOKEN) {
                return;
              }
              var end = i == target.length - 1;
              leaf = leaf.first();
              switch(leaf.name()) {
                case JsNode.TOKEN:
                  var id = leaf.token().content();
                  self.jsdc.appendBefore(id + '=' + temp + '[' + i + ']' + (end ? '' : ';'));
                  break;
                case JsNode.PRMREXPR:
                  var id = leaf.first().token().content();
                  self.jsdc.appendBefore(id + '=' + temp + '[' + i + '];');
                  self.jsdc.appendBefore('if(' + id + '===void 0)')
                  self.jsdc.appendBefore(id + '=' + self.join(leaf.next().next()) + (end ? '' : ';'));
                  break;
                case JsNode.ARRLTR:
                case JsNode.OBJLTR:
                  self.destructExpr(leaf, {
                    temp: temp,
                    index: i
                  });
              }
            });
            if(!self.inAssign[first.nid()]
              && (assignexpr.parent().name() == JsNode.ASSIGNEXPR
                || assignexpr.parent().name() == JsNode.INITLZ)) {
              return;
            }
            if(self.inAssign[first.nid()]) {
              self.jsdc.appendBefore(';return ' + temp);
            }
            self.jsdc.appendBefore('}()');
          }
          break;
        case JsNode.OBJLTR:
          if(start) {
            self.jsdc.ignore(first);
            if(assignexpr.parent().name() == JsNode.ASSIGNEXPR) {
              self.hash[first.nid()] = self.hash[assignexpr.parent().first().first().nid()];
              this.jsdc.ignore(assignexpr.leaf(1));
              return;
            }
            else if(assignexpr.parent().name() == JsNode.INITLZ) {
              var bindpat = assignexpr.parent().prev();
              if(bindpat.name() == JsNode.ARRBINDPAT
                || bindpat.name() == JsNode.OBJBINDPAT) {
                self.hash[first.nid()] = self.hash[assignexpr.parent().prev().nid()];
                this.jsdc.ignore(assignexpr.leaf(1));
              }
              else {
                self.jsdc.append('function(){var ');
                var temp = self.jsdc.uid();
                self.hash[first.nid()] = temp;
                self.inAssign[first.nid()] = true;
                self.jsdc.append(temp);
              }
            }
            else {
              self.jsdc.append('!function(){var ');
              var temp = self.jsdc.uid();
              self.hash[first.nid()] = temp;
              self.jsdc.append(temp);
            }
          }
          else {
            self.jsdc.appendBefore(';');
            var temp = self.hash[first.nid()];
            var target = self.getName(first.leaves());
            target.forEach(function(leaf, i) {
              var end = i == target.length - 1;
              leaf = leaf.first();
              switch(leaf.name()) {
                case JsNode.TOKEN:
                  var id = leaf.token().content();
                  self.jsdc.appendBefore(id + '=' + temp + '["' + id + '"]' + (end ? '' : ';'));
                  if(leaf.next()) {
                    var init = leaf.next();
                    self.jsdc.appendBefore((end ? ';' : '') + 'if(' + id + '===void 0)')
                    self.jsdc.appendBefore(id + self.join(init) + (end ? '' : ';'));
                  }
                  break;
                case JsNode.PROPTNAME:
                  var last = leaf.next().next().first();
                  var name = leaf.first().first().token().content();
                  switch(last.name()) {
                    case JsNode.TOKEN:
                      var id = last.token().content();
                      self.jsdc.appendBefore(id + '=' + temp + '["' + name + '"]' + (end ? '' : ';'));
                      break;
                    case JsNode.ARRLTR:
                    case JsNode.OBJLTR:
                      self.destructExpr(last, {
                        temp: temp,
                        name: name,
                        index: 0
                      });
                      break;
                  }
                  break;
              }
            });
            if(!self.inAssign[first.nid()]
              && (assignexpr.parent().name() == JsNode.ASSIGNEXPR
                || assignexpr.parent().name() == JsNode.INITLZ)) {
              return;
            }
            if(self.inAssign[first.nid()]) {
              self.jsdc.appendBefore(';return ' + temp);
            }
            self.jsdc.appendBefore('}()');
          }
          break;
      }
    },
    destructExpr: function(node, data) {
      var self = this;
      switch(node.name()) {
        case JsNode.ARRLTR:
          self.jsdc.appendBefore('var ');
          var temp = self.jsdc.uid();
          if(data.name) {
            self.jsdc.appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
          }
          else {
            self.jsdc.appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
          }
          var target = self.getArray(node.leaves());
          target.forEach(function(leaf, i) {
            if(leaf.name() == JsNode.TOKEN) {
              return;
            }
            var end = i == target.length - 1;
            leaf = leaf.first();
            switch(leaf.name()) {
              case JsNode.TOKEN:
                var id = leaf.token().content();
                self.jsdc.appendBefore(id + '=' + temp + '[' + i + ']' + (end ? '' : ';'));
                break;
              case JsNode.PRMREXPR:
                var id = leaf.first().token().content();
                self.jsdc.appendBefore(id + '=' + temp + '[' + i + '];');
                self.jsdc.appendBefore('if(' + id + '===void 0)')
                self.jsdc.appendBefore(id + '=' + self.join(leaf.next().next()) + (end ? '' : ';'));
                break;
              case JsNode.ARRLTR:
              case JsNode.OBJLTR:
                self.destructExpr(leaf, {
                  temp: temp,
                  index: i
                });
            }
          });
          break;
        case JsNode.OBJLTR:
          self.jsdc.appendBefore('var ');
          var temp = self.jsdc.uid();
          if(data.name) {
            self.jsdc.appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
          }
          else {
            self.jsdc.appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
          }
          var target = self.getArray(node.leaves());
          target.forEach(function(leaf, i) {
            var end = i == target.length - 1;
            leaf = leaf.first();
            switch(leaf.name()) {
              case JsNode.TOKEN:
                var id = leaf.token().content();
                self.jsdc.appendBefore(id + '=' + temp + '["' + id + '"]' + (end ? '' : ';'));
                if(leaf.next()) {
                  var init = leaf.next();
                  self.jsdc.appendBefore((end ? ';' : '') + 'if(' + id + '===void 0)')
                  self.jsdc.appendBefore(id + self.join(init) + (end ? '' : ';'));
                }
                break;
              case JsNode.PROPTNAME:
                var last = leaf.next().next().first();
                var name = leaf.first().first().token().content();
                switch(last.name()) {
                  case JsNode.TOKEN:
                    var id = last.token().content();
                    self.jsdc.appendBefore(id + '=' + temp + '["' + name + '"]' + (end ? '' : ';'));
                    break;
                  case JsNode.ARRLTR:
                  case JsNode.OBJLTR:
                    self.destructExpr(last, {
                      temp: temp,
                      name: name,
                      index: 0
                    });
                    break;
                }
                break;
            }
          });
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
        return i % 2 == 1 && i != leaves.length - 1;
      });
    },
    join: function(node, res) {
      res = res || { s: '' };
      var self = this;
      var isToken = node.name() == JsNode.TOKEN;
      var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
      if(isToken) {
        if(!isVirtual) {
          res.s += node.token().content();
        }
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.join(leaf, res);
        });
      }
      return res.s;
    }
  });
  
  module.exports = Destruct;
  
});