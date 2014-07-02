define(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  var Token = homunculus.getClass('Token');
  
  var Class = require('./util/Class');
  var join = require('./join');
  
  var Destruct = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
    this.inAssign = {};
    this.idCache = {};
  }).methods({
    getIds: function(node, res) {
      if(this.idCache.hasOwnProperty(node.nid())) {
        return this.idCache[node.nid()];
      }
      this.jsdc.ignore(node, 'destruct1');
      res = res || { arr: [] };
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
        switch(leaf.name()) {
          case JsNode.SINGLENAME:
            res.push(leaf.first().first().token().content());
            break;
          case JsNode.BINDREST:
            res.push(leaf.last().first().token().content());
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
          else if(first.name() == JsNode.PROPTNAME) {
            first = leaf.leaf(2);
            if(first.name() == JsNode.SINGLENAME) {
              res.push(first.first().first().token().content());
            }
          }
        }
      });
      this.idCache[node.nid()] = res;
      return res;
    },
    parse: function(node, start, ret) {
      var self = this;
      var first;
      if(ret) {
        first = node;
      }
      else {
        first = node.first();
      }
      switch(first.name()) {
        case JsNode.ARRBINDPAT:
          if(start) {
            if(!ret) {
              //忽略前面的,改为;
              var prev = node.prev();
              if(prev.token().content() == ',') {
                self.jsdc.append(';');
              }
              self.jsdc.append('!function(){var ');
            }
            var temp;
            if(ret) {
              temp = ret.o;
            }
            else {
              temp = self.jsdc.uid();
            }
            self.hash[first.nid()] = temp;
            !ret && self.jsdc.append(temp);
          }
          else {
            !ret && self.jsdc.appendBefore(';');
            var temp = self.hash[first.nid()];
            var target = self.getArray(first.leaves());
            target.forEach(function(leaf, i) {
              var end = i == target.length - 1;
              switch(leaf.name()) {
                case JsNode.SINGLENAME:
                  var id = leaf.first().first().token().content();
                  //在forof中由于最后一个默认值变量冲突需特殊对待
                  if(ret && end && leaf.size() == 2) {
                    var temp2 = self.jsdc.uid();
                    ret.append('!function(){var ' + temp2 + '=' + id + ';');
                    ret.append(id + '=' + temp + '[' + i + '];');
                    var init = leaf.last();
                    ret.append('if(' + temp2 + '.indexOf(' + id + ')!=' + i + ')');
                    ret.append(id + join(init) + '}();');
                  }
                  else {
                    (ret || self.jsdc).appendBefore(id + '=' + temp + '[' + i + ']' + (!ret && end ? '' : ';'));
                    //初始化赋值
                    if(leaf.size() == 2) {
                      var init = leaf.last();
                      (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(' + temp + '.indexOf(' + id + ')!=' + i + ')');
                      (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                    }
                  }
                  break;
                case JsNode.BINDELEM:
                  self.destruct(leaf.first(), {
                    temp: temp,
                    end: end,
                    index: i
                  }, ret);
                  break;
                case JsNode.BINDREST:
                  var id = leaf.last().first().token().content();
                  (ret || self.jsdc).appendBefore(id + '=' + temp + '.slice(' + i + ')');
              }
            });
            if(!ret) {
              (ret || self.jsdc).appendBefore('}()');
              //忽略后面的,改为;
              var next = node.next();
              if(next.token().content() == ',') {
                next = next.next();
                if(next.first().name() == JsNode.BINDID) {
                  (ret || self.jsdc).appendBefore(';var ');
                }
              }
            }
          }
          break;
        case JsNode.OBJBINDPAT:
          if(start) {
            if(!ret) {
              //忽略前面的,改为;
              var prev = node.prev();
              if(prev.token().content() == ',') {
                self.jsdc.append(';');
              }
              self.jsdc.append('!function(){var ');
            }
            var temp;
            if(ret) {
              temp = ret.o;
            }
            else {
              temp = self.jsdc.uid();
            }
            self.hash[first.nid()] = temp;
            !ret && self.jsdc.append(temp);
          }
          else {
            !ret && self.jsdc.appendBefore(';');
            var temp = self.hash[first.nid()];
            var target = self.getName(first.leaves());
            target.forEach(function(leaf, i) {
              var end = i == target.length - 1;
              leaf = leaf.first();
              switch(leaf.name()) {
                case JsNode.SINGLENAME:
                  var id = leaf.first().first().token().content();
                  //在forof中由于最后一个默认值变量冲突需特殊对待
                  if(ret && end && leaf.size() == 2) {
                    var temp2 = self.jsdc.uid();
                    ret.append('!function(){var ' + temp2 + '=' + id + ';');
                    ret.append(id + '=' + temp + '["' + id + '"];');
                    var init = leaf.last();
                    ret.append('if(!' + temp2 + '.hasOwnProperty("' + id + '"))');
                    ret.append(id + join(init) + '}();');
                  }
                  else {
                    (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + id + '"]' + (!ret && end ? '' : ';'));
                    //初始化赋值
                    if(leaf.size() == 2) {
                      var init = leaf.last();
                      (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + id + '"))');
                      (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                    }
                  }
                  break;
                case JsNode.PROPTNAME:
                  var last = leaf.next().next();
                  var name = leaf.first().first().token().content();
                  switch(last.name()) {
                    case JsNode.SINGLENAME:
                      var id = last.first().first().token().content();
                      //在forof中由于最后一个默认值变量冲突需特殊对待
                      if(ret && end && last.size() == 2) {
                        var temp2 = this.jsdc.uid();
                        ret.append('!function(){var ' + temp2 + ';');
                        ret.appendBefore(id + '=' + temp + '["' + name + '"]' + (!ret && end ? '' : ';'));
                        var init = last.last();
                        ret.appendBefore('if(!' + temp2 + '.hasOwnProperty("' + name + '"))');
                        ret.appendBefore(id + join(init) + '}();');
                      }
                      else {
                        (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + name + '"]' + (!ret && end ? '' : ';'));
                        //初始化赋值
                        if(last.size() == 2) {
                          var init = last.last();
                          (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + name + '"))');
                          (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                        }
                      }
                      break;
                    case JsNode.BINDELEM:
                      self.destruct(last.first(), {
                        temp: temp,
                        end: end,
                        name: name,
                        index: 0
                      }, ret);
                      break;
                  }
                  break;
              }
            });
            if(!ret) {
              self.jsdc.appendBefore('}()');
              //忽略后面的,改为;
              var next = node.next();
              if(next.token().content() == ',') {
                next = next.next();
                if(next.first().name() == JsNode.BINDID) {
                  self.jsdc.appendBefore(';var ');
                }
              }
            }
          }
          break;
      }
    },
    destruct: function(node, data, ret) {
      var self = this;
      switch(node.name()) {
        case JsNode.ARRBINDPAT:
          (ret || self.jsdc).appendBefore('var ');
          var temp = self.jsdc.uid();
          if(data.name) {
            (ret || self.jsdc).appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
          }
          else {
            (ret || self.jsdc).appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
          }
          var target = self.getArray(node.leaves());
          target.forEach(function(leaf, i) {
            var end = i == target.length - 1 && data.end;
            switch(leaf.name()) {
              case JsNode.SINGLENAME:
                var id = leaf.first().first().token().content();
                //在forof中由于最后一个默认值变量冲突需特殊对待
                if(ret && end && leaf.size() == 2) {
                  var temp2 = self.jsdc.uid();
                  ret.append('!function(){var ' + temp2 + '=' + id + ';');
                  ret.append(id + '=' + temp + '[' + i + '];');
                  var init = leaf.last();
                  ret.append('if(' + temp2 + '.indexOf(' + id + ')!=' + i + ')');
                  ret.append(id + join(init) + '}();');
                }
                else {
                  (ret || self.jsdc).appendBefore(id + '=' + temp + '[' + i + ']' + (!ret && end ? '' : ';'));
                  //初始化赋值
                  if(leaf.size() == 2) {
                    var init = leaf.last();
                    (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(' + temp + '.indexOf(' + id + ')!=' + i + ')');
                    (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                  }
                }
                break;
              case JsNode.BINDELEM:
                self.destruct(leaf.first(), {
                  temp: temp,
                  end: end,
                  index: i
                }, ret);
                break;
              case JsNode.BINDREST:
                var id = leaf.last().first().token().content();
                (ret || self.jsdc).appendBefore(id + '=' + temp + '.slice(' + i + ')');
            }
          });
          break;
        case JsNode.OBJBINDPAT:
          (ret || self.jsdc).appendBefore('var ');
          var temp = self.jsdc.uid();
          if(data.name) {
            (ret || self.jsdc).appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
          }
          else {
            (ret || self.jsdc).appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
          }
          var target = self.getArray(node.leaves());
          target.forEach(function(leaf, i) {
            var end = i == target.length - 1 && data.end;
            leaf = leaf.first();
            switch(leaf.name()) {
              case JsNode.SINGLENAME:
                var id = leaf.first().first().token().content();
                //在forof中由于最后一个默认值变量冲突需特殊对待
                if(ret && end && leaf.size() == 2) {
                  var temp2 = self.jsdc.uid();
                  ret.append('!function(){var ' + temp2 + '=' + id + ';');
                  ret.append(id + '=' + temp + '["' + id + '"];');
                  var init = leaf.last();
                  ret.append('if(!' + temp2 + '.hasOwnProperty("' + id + '"))');
                  ret.append(id + join(init) + '}();');
                }
                else {
                  (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + id + '"]' + (!ret && end ? '' : ';'));
                  //初始化赋值
                  if(leaf.size() == 2) {
                    var init = leaf.last();
                    (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + id + '"))');
                    (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                  }
                }
                break;
              case JsNode.PROPTNAME:
                var last = leaf.next().next();
                var name = leaf.first().first().token().content();
                switch(last.name()) {
                  case JsNode.SINGLENAME:
                    var id = last.first().first().token().content();
                    //在forof中由于最后一个默认值变量冲突需特殊对待
                    if(ret && end && last.size() == 2) {
                      var temp2 = this.jsdc.uid();
                      ret.append('!function(){var ' + temp2 + ';');
                      ret.appendBefore(id + '=' + temp + '["' + name + '"]' + (!ret && end ? '' : ';'));
                      var init = last.last();
                      ret.appendBefore('if(!' + temp2 + '.hasOwnProperty("' + name + '"))');
                      ret.appendBefore(id + join(init) + '}();');
                    }
                    else {
                      (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + name + '"]' + (!ret && end ? '' : ';'));
                      //初始化赋值
                      if(last.size() == 2) {
                        var init = last.last();
                        (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + name + '"))');
                        (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                      }
                    }
                    break;
                  case JsNode.BINDELEM:
                    self.destruct(last.first(), {
                      temp: temp,
                      end: end,
                      name: name,
                      index: 0
                    }, ret);
                    break;
                }
                break;
            }
          });
          break;
      }
    },
    expr: function(assignexpr, start, ret) {
      var self = this;
      var first;
      if(ret) {
        first = assignexpr;
      }
      else {
        first = assignexpr.first();
        first = first.first();
      }
      switch(first.name()) {
        case JsNode.ARRLTR:
          if(start) {
            !ret && this.jsdc.ignore(first, 'destruct2');
            if(assignexpr.parent().name() == JsNode.ASSIGNEXPR) {
              self.hash[first.nid()] = self.hash[assignexpr.parent().first().first().nid()];
              !ret && this.jsdc.ignore(assignexpr.leaf(1), 'destruct3');
            }
            else if(assignexpr.parent().name() == JsNode.INITLZ) {
              var bindpat = assignexpr.parent().prev();
              if(bindpat.name() == JsNode.ARRBINDPAT
                || bindpat.name() == JsNode.OBJBINDPAT) {
                self.hash[first.nid()] = self.hash[assignexpr.parent().prev().nid()];
                !ret && this.jsdc.ignore(assignexpr.leaf(1), 'destruct4');
              }
              else {
                !ret && self.jsdc.append('function(){var ');
                var temp;
                if(ret) {
                  temp = ret.o;
                }
                else {
                  temp = self.jsdc.uid();
                  self.inAssign[first.nid()] = true;
                }
                self.hash[first.nid()] = temp;
                !ret && self.jsdc.append(temp);
              }
            }
            else {
              var temp;
              if(ret) {
                temp = ret.o;
              }
              else {
                temp = self.jsdc.uid();
              }
              self.hash[first.nid()] = temp;
              !ret && self.jsdc.append('function(){var ');
              !ret && self.jsdc.append(temp);
            }
          }
          else {
            !ret && self.jsdc.appendBefore(';');
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
                  if(leaf.token().content() == '...') {
                    var id = leaf.next().first().token().content();
                    (ret || self.jsdc).appendBefore(id + '=' + temp + '.slice(' + i + ')');
                  }
                  else {
                    var id = leaf.token().content();
                    (ret || self.jsdc).appendBefore(id + '=' + temp + '[' + i + ']' + (!ret && end ? '' : ';'));
                  }
                  break;
                case JsNode.PRMREXPR:
                  var id = leaf.first().token().content();
                  //在forof中由于最后一个默认值变量冲突需特殊对待
                  if(ret && end) {
                    var temp2 = self.jsdc.uid();
                    ret.append('!function(){var ' + temp2 + '=' + id + ';');
                    ret.append(id + '=' + temp + '[' + i + '];');
                    ret.append('if(' + temp2 + '.indexOf(' + id + ')!=' + i + ')');
                    ret.append(id + '=' + join(leaf.next().next()) + '}();');
                  }
                  else {
                    (ret || self.jsdc).appendBefore(id + '=' + temp + '[' + i + '];');
                    (ret || self.jsdc).appendBefore('if(' + temp + '.indexOf(' + id + ')!=' + i + ')');
                    (ret || self.jsdc).appendBefore(id + '=' + join(leaf.next().next()) + (!ret && end ? '' : ';'));
                  }
                  break;
                case JsNode.ARRLTR:
                case JsNode.OBJLTR:
                  self.destructExpr(leaf, {
                    temp: temp,
                    end: end,
                    index: i
                  }, ret);
              }
            });
            if(!self.inAssign[first.nid()]
              && (assignexpr.parent().name() == JsNode.ASSIGNEXPR
                || assignexpr.parent().name() == JsNode.INITLZ)) {
              return;
            }
            ret || (self.jsdc.appendBefore(';return ' + temp));
            ret || (self.jsdc.appendBefore('}()'));
          }
          break;
        case JsNode.OBJLTR:
          if(start) {
            self.jsdc.ignore(first, 'destruct5');
            if(assignexpr.parent().name() == JsNode.ASSIGNEXPR) {
              self.hash[first.nid()] = self.hash[assignexpr.parent().first().first().nid()];
              this.jsdc.ignore(assignexpr.leaf(1), 'destruct6');
              return;
            }
            else if(assignexpr.parent().name() == JsNode.INITLZ) {
              var bindpat = assignexpr.parent().prev();
              if(bindpat.name() == JsNode.ARRBINDPAT
                || bindpat.name() == JsNode.OBJBINDPAT) {
                self.hash[first.nid()] = self.hash[assignexpr.parent().prev().nid()];
                this.jsdc.ignore(assignexpr.leaf(1), 'destruct7');
              }
              else {
                !ret && self.jsdc.append('function(){var ');
                var temp;
                if(ret) {
                  temp = ret.o;
                }
                else {
                  temp = self.jsdc.uid();
                  self.inAssign[first.nid()] = true;
                }
                self.hash[first.nid()] = temp;
                !ret && self.jsdc.append(temp);
              }
            }
            else {
              !ret && self.jsdc.append('function(){var ');
              var temp;
              if(ret) {
                temp = ret.o;
              }
              else {
                temp = self.jsdc.uid();
              }
              self.hash[first.nid()] = temp;
              !ret && self.jsdc.append(temp);
            }
          }
          else {
            !ret && self.jsdc.appendBefore(';');
            var temp = self.hash[first.nid()];
            var target = self.getName(first.leaves());
            target.forEach(function(leaf, i) {
              var end = i == target.length - 1;
              leaf = leaf.first();
              switch(leaf.name()) {
                case JsNode.TOKEN:
                  var id = leaf.token().content();
                  //在forof中由于最后一个默认值变量冲突需特殊对待
                  if(ret && end && leaf.next()) {
                    var temp2 = self.jsdc.uid();
                    ret.append('!function(){var ' + temp2 + '=' + id + ';');
                    ret.append(id + '=' + temp + '["' + id + '"];');
                    var init = leaf.next();
                    ret.append('if(!' + temp2 + '.hasOwnProperty("' + id + '"))');
                    ret.append(id + join(init) + '}();');
                  }
                  else {
                    (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + id + '"]' + (!ret && end ? '' : ';'));
                    if(leaf.next()) {
                      var init = leaf.next();
                      (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + id + '"))');
                      (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                    }
                  }
                  break;
                case JsNode.PROPTNAME:
                  var last = leaf.next().next().first();
                  var name = leaf.first().first().token().content();
                  switch(last.name()) {
                    case JsNode.TOKEN:
                      var id = last.token().content();
                      //在forof中由于最后一个默认值变量冲突需特殊对待
                      if(ret && end && last.size() == 2) {
                        var temp2 = self.jsdc.uid();
                        ret.append('!function(){var ' + temp2 + '=' + id + ';');
                        ret.append(id + '=' + temp + '["' + name + '"];');
                        var init = last.last();
                        ret.append('if(!' + temp2 + '.hasOwnProperty("' + name + '"))');
                        ret.append(id + join(init) + '}();');
                      }
                      else {
                        (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + name + '"]' + (!ret && end ? '' : ';'));
                        //初始化赋值
                        if(last.size() == 2) {
                          var init = last.last();
                          (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + name + '"))');
                          (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                        }
                      }
                      break;
                    case JsNode.PRMREXPR:
                      var id = last.first().token().content();
                      //在forof中由于最后一个默认值变量冲突需特殊对待
                      if(ret && end && last.next()) {
                        var temp2 = self.jsdc.uid();
                        ret.append('!function(){var ' + temp2 + '=' + id + ';');
                        ret.append(id + '=' + temp + '["' + name + '"];');
                        ret.append('if(!' + temp2 + '.hasOwnProperty("' + name + '"))');
                        ret.append(join(last.parent()) + '}();');
                      }
                      else {
                        (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + name + '"]' + (!ret && end ? '' : ';'));
                        //初始化赋值
                        if(last.next()) {
                          (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + name + '"))');
                          (ret || self.jsdc).appendBefore(join(last.parent()) + (!ret && end ? '' : ';'));
                        }
                      }
                      break;
                    case JsNode.ARRLTR:
                    case JsNode.OBJLTR:
                      self.destructExpr(last, {
                        temp: temp,
                        end: end,
                        name: name,
                        index: 0
                      }, ret);
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
            !ret && self.jsdc.appendBefore(';return ' + temp);
            !ret && self.jsdc.appendBefore('}()');
          }
          break;
      }
    },
    destructExpr: function(node, data, ret) {
      var self = this;
      switch(node.name()) {
        case JsNode.ARRLTR:
          (ret || self.jsdc).appendBefore('var ');
          var temp = self.jsdc.uid();
          if(data.name) {
            (ret || self.jsdc).appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
          }
          else {
            (ret || self.jsdc).appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
          }
          var target = self.getArray(node.leaves());
          target.forEach(function(leaf, i) {
            if(leaf.name() == JsNode.TOKEN) {
              return;
            }
            var end = i == target.length - 1 && data.end;
            leaf = leaf.first();
            switch(leaf.name()) {
              case JsNode.TOKEN:
                if(leaf.token().content() == '...') {
                  var id = leaf.next().first().token().content();
                  (ret || self.jsdc).appendBefore(id + '=' + temp + '.slice(' + i + ')');
                }
                else {
                  var id = leaf.token().content();
                  (ret || self.jsdc).appendBefore(id + '=' + temp + '[' + i + ']' + (!ret && end ? '' : ';'));
                }
                break;
              case JsNode.PRMREXPR:
                var id = leaf.first().token().content();
                (ret || self.jsdc).appendBefore(id + '=' + temp + '[' + i + '];');
                (ret || self.jsdc).appendBefore('if(' + temp + '.indexOf(' + id + ')!=' + i + ')');
                (ret || self.jsdc).appendBefore(id + '=' + join(leaf.next().next()) + (!ret && end ? '' : ';'));
                break;
              case JsNode.ARRLTR:
              case JsNode.OBJLTR:
                self.destructExpr(leaf, {
                  temp: temp,
                  end: end,
                  index: i
                }, ret);
            }
          });
          break;
        case JsNode.OBJLTR:
          (ret || self.jsdc).appendBefore('var ');
          var temp = self.jsdc.uid();
          if(data.name) {
            (ret || self.jsdc).appendBefore(temp + '=' + data.temp + '["' + data.name + '"];');
          }
          else {
            (ret || self.jsdc).appendBefore(temp + '=' + data.temp + '[' + data.index + '];');
          }
          var target = self.getArray(node.leaves());
          target.forEach(function(leaf, i) {
            var end = i == target.length - 1 && data.end;
            leaf = leaf.first();
            switch(leaf.name()) {
              case JsNode.TOKEN:
                var id = leaf.token().content();
                (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + id + '"]' + (!ret && end ? '' : ';'));
                if(leaf.next()) {
                  var init = leaf.next();
                  (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + id + '"))');
                  (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                }
                break;
              case JsNode.PROPTNAME:
                var last = leaf.next().next().first();
                var name = leaf.first().first().token().content();
                switch(last.name()) {
                  case JsNode.TOKEN:
                    var id = last.token().content();
                    (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + name + '"]' + (!ret && end ? '' : ';'));
                    //初始化赋值
                    if(last.size() == 2) {
                      var init = last.last();
                      (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + name + '"))');
                      (ret || self.jsdc).appendBefore(id + join(init) + (!ret && end ? '' : ';'));
                    }
                    break;
                  case JsNode.PRMREXPR:
                    var id = last.first().token().content();
                    (ret || self.jsdc).appendBefore(id + '=' + temp + '["' + name + '"]' + (!ret && end ? '' : ';'));
                    //初始化赋值
                    if(last.next()) {
                      (ret || self.jsdc).appendBefore((!ret && end ? ';' : '') + 'if(!' + temp + '.hasOwnProperty("' + name + '"))');
                      (ret || self.jsdc).appendBefore(join(last.parent()) + (!ret && end ? '' : ';'));
                    }
                    break;
                  case JsNode.ARRLTR:
                  case JsNode.OBJLTR:
                    self.destructExpr(last, {
                      temp: temp,
                      end: end,
                      name: name,
                      index: 0
                    }, ret);
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
    }
  });
  
  module.exports = Destruct;
  
});