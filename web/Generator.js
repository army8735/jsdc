define(function(require, exports, module){var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');
var Token = homunculus.getClass('token');

var Class = require('./util/Class');
var join = require('./join');
var eventbus = require('./eventbus');

var Generator = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.hash = {};
  this.star = {};
  this.stmt = {};
}).methods({
  parse: function(node, start) {
    var self = this;
    if(start) {
      self.jsdc.ignore(node.leaf(1), 'gen1');
      var token = node.leaf(2).first().token();
      //有可能被scope前置过
      var hasPre = token.ignore;
      self.jsdc.ignore(token, 'gen2');
      if(!hasPre) {
        self.jsdc.append('var ');
        self.jsdc.append(node.leaf(2).first().token().content());
        self.jsdc.append('=');
      }
      self.gen(node);
    }
    else {
      self.jsdc.appendBefore('}}();');
    }

  },
  expr: function(node, start) {
    var self = this;
    if(start) {
      self.jsdc.ignore(node.first(), 'gen3');
      self.jsdc.ignore(node.leaf(1), 'gen4');
      if(node.leaf(2).name() == JsNode.BINDID) {
        self.jsdc.ignore(node.leaf(2), 'gen5');
      }
      self.gen(node);
    }
    else {
      self.jsdc.appendBefore('}}()');
    }
  },
  gen: function(node) {
    var self = this;
    self.jsdc.ignore(node.first(), 'gen6');
    var state;
    var res = self.count(node.last().prev(), node);
    var count = res.count;
    if(count) {
      state = self.jsdc.uid();
    }
    var temp = self.jsdc.uid();
    var param = node.leaf(4).first();
    var ret = res.return;
    if(res.pre) {
      self.pre(node.last().prev(), node.nid(), node.last().prev().nid());
    }
    if(!param) {
      if(count) {
        param = self.jsdc.uid();
        eventbus.on(node.leaf(4).nid(), function(node, start) {
          start && self.jsdc.append(param);
        });
      }
      else {
        param = '';
      }
    }
    else if(param.name() == JsNode.SINGLENAME) {
      param = param.first().first().token().content();
    }
    else if(param.name() == JsNode.BINDREST) {
      param = param.last().first().token().content() + '[0]';
    }
    var o = self.hash[node.nid()] = {
      state: state,
      index: 0,
      index2: 0,
      count: count,
      return: ret,
      if: 0,
      temp: temp,
      param: param,
      last: null,
      yield: [],
      pre: res.pre
    };
    self.jsdc.append('function(){');
    if(o.count) {
      self.jsdc.append('return function(){var ' + state + '=0;return{next:' + temp + '};');
    }
    else {
      self.jsdc.append('return function(){return{next:' + temp + '};');
    }
    o.pos = self.jsdc.res.length;
    self.jsdc.append('function ' + temp);
  },
  yield: function(node, start) {
    var self = this;
    var top = self.closest(node);
    var o = self.hash[top.nid()];
    if(start) {
      self.jsdc.ignore(node.first(), 'gen7');
      //赋值语句需要添加上参数，先默认undefined，并记录在变量中为下次添加做标记
      var parent = node.parent();
      switch(parent.name()) {
        case JsNode.INITLZ:
          o.last = join(parent.prev());
          break;
        case JsNode.ASSIGNEXPR:
          o.last = join(parent.first());
          break;
        default:
          o.last = null;
      }
      //加上状态变更
      o.index++;
      self.jsdc.append(o.state + '=' + ++o.index2 + ';');
      //yield *
      if(node.size() > 2
        && node.leaf(1).name() == JsNode.TOKEN
        && node.leaf(1).token().content() == '*') {
        self.jsdc.ignore(node.leaf(1), 'gen8');
        var temp = this.star[node.nid()] = self.jsdc.uid();
        self.jsdc.append('var ' + temp + '=');
      }
      else {
        self.jsdc.append('return{value:');
        //无yield返回，则附上undefined
        if(node.size() == 1) {
          self.jsdc.append('void 0');
        }
      }
    }
    else {
      //yield *
      if(self.star.hasOwnProperty(node.nid())) {
        var temp = self.star[node.nid()];
        self.jsdc.appendBefore('.next();return{done:(!' + temp + '.done&&' + o.state + '--),value:' + temp + '}');
        o.yield.push({
          i: self.jsdc.i,
          star: temp
        });
      }
      else {
        var belong = self.belong(node);
        if(belong.length) {
          var done = belong.map(function(o) {
            return o.done || 0;
          });
          done.push((o.index == o.count) ? 1 : 0);
          done.push((o.return) ? 0 : 1);
          if(done.indexOf(0) > -1) {
            done = [false];
          }
          var hash = {};
          done = done.filter(function(o) {
            var res = !hash.hasOwnProperty(o);
            hash[o] = true;
            return res;
          });
          self.jsdc.appendBefore(',done:' + done.join('&&') + '}');
        }
        else {
          self.jsdc.appendBefore(',done:' + (o.index == o.count && !o.return) + '}');
        }
        o.yield.push({
          i: self.jsdc.i
        });
      }
      self.ignoreNext(node, ';');
      if(o.index < o.count) {
        self.jsdc.appendBefore(';case ' + o.index2 + ':');
      }
      else {
        self.jsdc.appendBefore(';case ' + o.index2 + ':');
      }
      //有赋值需要先赋值
      if(o.last) {
        self.jsdc.appendBefore(o.last + '=' + o.param + ';');
      }
      o.last = null;
    }
  },
  body: function(node, start) {
    var top = node.parent();
    if(top.name() == JsNode.GENDECL) {
      var o = this.hash[top.nid()];
      if(start) {
        if(o.count) {
          this.jsdc.append('while(1){switch(' + o.state + '){case 0:');
        }
      }
      else if(!o.return) {
        if(o.count) {
          if(!this.jsdc.endsWith(';')
            && !this.jsdc.endsWith(':')
            && !this.jsdc.endsWith('{')
            && !this.jsdc.endsWith('}')
            && !this.jsdc.endsWith('\n')) {
            this.jsdc.appendBefore(';');
          }
          this.jsdc.appendBefore(o.state + '=-1');
          this.jsdc.appendBefore(';default:return{done:true}}}');
        }
        else {
          this.jsdc.appendBefore(';return{done:true}');
        }
      }
    }
  },
  closest: function(node) {
    var parent = node;
    while(parent = parent.parent()) {
      if(parent.name() == JsNode.GENDECL
        || parent.name() == JsNode.GENEXPR) {
        return parent;
      }
    }
  },
  prevar: function(varstmt) {
    var self = this;
    var top = varstmt.gen;
    if(top) {
      self.jsdc.ignore(varstmt.first(), 'gen9');
      varstmt.leaves().forEach(function(leaf, i) {
        if(i % 2 == 1) {
          var first = leaf.first();
          switch(first.name()) {
            case JsNode.BINDID:
              self.jsdc.insert('var ' + first.first().token().content() + ';', self.hash[top.nid()].pos);
              break;
            case JsNode.ARRBINDPAT:
            case JsNode.OBJBINDPAT:
              //destruct需忽略前后可能的,再改为; var也需忽略
              self.jsdc.ignore(leaf.prev(), 'gen40');
              var next = leaf.next();
              if(next.token().content() == ',') {
                self.jsdc.ignore(next, 'gen41');
              }
              var ids = self.jsdc.destruct.getIds(first);
              ids.forEach(function(id) {
                self.jsdc.insert('var ' + id + ';', self.hash[top.nid()].pos);
              });
              break;
          }
        }
      });
    }
  },
  count: function(node, top, res) {
    res = res || { count: 0, return: false, pre: false };
    var self = this;
    var isToken = node.name() == JsNode.TOKEN;
    if(!isToken) {
      switch(node.name()) {
        case JsNode.YIELDEXPR:
          res.count++;
          //赋值语句忽略
          var parent = node.parent();
          switch(parent.name()) {
            case JsNode.INITLZ:
              self.jsdc.ignore(parent.prev(), 'gen10');
              self.jsdc.ignore(node.prev(), 'gen11');
              break;
            case JsNode.ASSIGNEXPR:
              self.jsdc.ignore(parent.first(), 'gen12');
              self.jsdc.ignore(node.prev(), 'gen13');
              break;
          }
          var belong = self.belong(node);
          belong.forEach(function(f) {
            self.stmt[f.nid()] = true;
            res.pre = true;
          });
          break;
        case JsNode.RETSTMT:
          res.return = node;
          eventbus.on(node.nid(), function(node, start) {
            if(start) {
              var o = self.hash[top.nid()];
              if(o.count) {
                self.jsdc.appendBefore(';' + o.state + '=-1;default:');
              }
            }
          });
          //无return内容分开侦听
          if(node.leaf(1).name() == JsNode.TOKEN) {
            eventbus.on(node.leaf(0).nid(), function(node, start) {
              if(!start) {
                self.jsdc.append('{value:void 0');
              }
            });
            eventbus.on(node.nid(), function(node, start) {
              if(!start) {
                self.jsdc.appendBefore(',done:true}');
              }
            });
          }
          //有则侦听内容
          else {
            eventbus.on(node.leaf(1).nid(), function(node, start) {
              if(start) {
                self.jsdc.append('{value:');
              }
              else {
                self.jsdc.appendBefore(',done:true}');
              }
            });
          }
          break;
        //忽略这些节点中的yield语句
        case JsNode.CLASSDECL:
        case JsNode.CLASSEXPR:
        case JsNode.FNDECL:
        case JsNode.FNEXPR:
        case JsNode.GENDECL:
        case JsNode.GENEXPR:
        case JsNode.METHOD:
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.count(leaf, top, res);
      });
    }
    return res;
  },
  pre: function(node, nid, bid, res) {
    res = res || { index: 0 };
    var self = this;
    var isToken = node.name() == JsNode.TOKEN;
    if(!isToken) {
      switch(node.name()) {
        case JsNode.IFSTMT:
          if(self.stmt.hasOwnProperty(node.nid())) {
            var ifstmt = node;
            res.index++;
            var block = ifstmt.leaf(4);
            //改写if语句
            self.jsdc.ignore(ifstmt.first(), 'gen14');
            self.jsdc.ignore(ifstmt.leaf(1), 'gen15');
            self.jsdc.ignore(ifstmt.leaf(2), 'gen16');
            self.jsdc.ignore(ifstmt.leaf(3), 'gen17');
            if(block.name() == JsNode.BLOCKSTMT) {
              self.jsdc.ignore(block.first().first(), 'gen18');
              self.jsdc.ignore(block.first().last(), 'gen19');
            }
            var elseTemp;
            var ifEndTemp;
            var top;
            var elset = block.next();
            var elseblock;
            if(elset && elset.name() == JsNode.TOKEN) {
              elseblock = elset.next();
            }
            //if结束后的状态
            eventbus.on(ifstmt.nid(), function(node, start) {
              if(!start) {
                if(!self.jsdc.endsWith(';')
                  && !self.jsdc.endsWith(':')
                  && !self.jsdc.endsWith('{')
                  && !self.jsdc.endsWith('}')
                  && !self.jsdc.endsWith('\n')) {
                  self.jsdc.appendBefore(';');
                }
                self.jsdc.append('case ' + ifEndTemp + ':');
              }
            });
            //根据表达式true/false分2个state
            eventbus.on(block.nid(), function(node, start) {
              if(start) {
                top = self.hash[nid];
                index = top.index2;
                self.jsdc.append(top.state + '=');
                self.jsdc.append(join(ifstmt.leaf(2)));
                self.jsdc.append('?');
                self.jsdc.append(++top.index2 + ':');
                self.jsdc.append((elseblock ? ++top.index2 : top.index2 + 1) + ';break;');
                self.jsdc.append('case ' + (elseblock ? top.index2 - 1 : top.index2) + ':');
                elseTemp = top.index2;
                ifEndTemp = ++top.index2;
              }
              else {
                if(!self.jsdc.endsWith(';')
                  && !self.jsdc.endsWith(':')
                  && !self.jsdc.endsWith('{')
                  && !self.jsdc.endsWith('}')
                  && !self.jsdc.endsWith('\n')) {
                  self.jsdc.appendBefore(';');
                }
                self.jsdc.appendBefore(top.state + '=');
                self.jsdc.appendBefore(ifEndTemp);
                self.jsdc.appendBefore(';break;');
              }
            });
            //else语句忽略{}
            if(elseblock) {
              self.jsdc.ignore(elset, 'gen20');
              if(elseblock.name() == JsNode.BLOCKSTMT) {
                self.jsdc.ignore(elseblock.first().first(), 'gen21');
                self.jsdc.ignore(elseblock.first().last(), 'gen22');
              }
              eventbus.on(elseblock.nid(), function(node, start) {
                if(start) {
                  self.jsdc.append('case ' + elseTemp + ':');
                }
                else if(elseblock.name() != JsNode.IFSTMT
                  && elseblock.parent().name() != JsNode.IFSTMT) {
                  if(!self.jsdc.endsWith(';')
                    && !self.jsdc.endsWith(':')
                    && !self.jsdc.endsWith('{')
                    && !self.jsdc.endsWith('}')
                    && !self.jsdc.endsWith('\n')) {
                    self.jsdc.appendBefore(';');
                  }
                  self.jsdc.appendBefore(top.state + '=');
                  self.jsdc.appendBefore(ifEndTemp);
                  self.jsdc.appendBefore(';break;');
                }
              });
            }
          }
          break;
        case JsNode.ITERSTMT:
          var itstmt = node;
          var first = itstmt.first();
          var top;
          var loopTemp;
          var itTemp;
          var itEndTemp;
          var endTemp;
          switch(first.token().content()) {
            case 'for':
              var block = itstmt.last();
              if(block.name() == JsNode.BLOCKSTMT) {
                self.jsdc.ignore(block.first().first(), 'gen23');
                self.jsdc.ignore(block.first().last(), 'gen24');
              }
              self.jsdc.ignore(first, 'gen25');
              self.jsdc.ignore(node.leaf(1), 'gen26');
              self.jsdc.ignore(block.prev(), 'gen27');
              //of和in只会出现在3或4位
              var index = 0;
              if(node.leaf(3).name() == JsNode.TOKEN
                && ['of', 'in'].indexOf(node.leaf(3).token().content()) > -1) {
                index = 3;
              }
              else if(node.leaf(4).name() == JsNode.TOKEN
                && ['of', 'in'].indexOf(node.leaf(4).token().content()) > -1) {
                index = 4;
              }
              if(index > 0) {
                switch(node.leaf(index).token().content()) {
                  case 'in':
                    var keys = self.jsdc.uid();
                    var len = self.jsdc.uid();
                    var index2 = self.jsdc.uid();
                    var id = join(node.leaf(index - 1));
                    //插入var变量
                    if(index == 4) {
                      eventbus.on(itstmt.nid(), function(node, start) {
                        if(start) {
                          self.jsdc.insert('var ' + id + ';', self.hash[nid].pos);
                        }
                      });
                      self.jsdc.ignore(node.leaf(2), 'gen27');
                    }
                    var obj = self.jsdc.uid();
                    self.jsdc.ignore(node.leaf(index - 1), 'gen28');
                    self.jsdc.ignore(node.leaf(index), 'gen29');
                    eventbus.on(itstmt.leaf(index + 1).nid(), function(node, start) {
                      if(start) {
                        self.jsdc.append('var ' + obj + '=');
                        top = self.hash[nid];
                      }
                      else {
                        self.jsdc.appendBefore(',' + keys + '=Object.keys(');
                        self.jsdc.appendBefore(obj);
                        self.jsdc.appendBefore('),' + len);
                        self.jsdc.appendBefore('=' + keys + '.length,');
                        self.jsdc.appendBefore(index2 + '=0;');
                        endTemp = ++top.index2;
                        self.jsdc.appendBefore('case ' + endTemp + ':');
                        self.jsdc.appendBefore(top.state + '=');
                        self.jsdc.appendBefore(index2 + '++<' + len + '?');
                        itTemp = ++top.index2;
                        itEndTemp = ++top.index2;
                        self.jsdc.appendBefore(itTemp + ':' + itEndTemp + ';break;');
                        //供yield判断
                        itstmt.done = index2 + '<' + len;
                      }
                    });
                    eventbus.on(block.nid(), function(node, start) {
                      if(start) {
                        self.jsdc.append('case ' + itTemp + ':');
                        self.jsdc.append(id + '=');
                        self.jsdc.append(keys + '[');
                        self.jsdc.append(index2 + '];');
                      }
                      else {
                        self.jsdc.appendBefore(top.state + '=' + endTemp);
                        self.jsdc.appendBefore(';break;case ' + itEndTemp + ':');
                      }
                    });
                    break;
                  case 'of':
                    var iterator;
                    //标记使Forof类处理失效
                    itstmt.gen = true;
                    var next = self.jsdc.uid();
                    var isDestruct = [JsNode.ARRBINDPAT, JsNode.OBJBINDPAT].indexOf(node.leaf(index - 1).name()) > -1 ? node.leaf(index - 1) : false;
                    var id = isDestruct ? self.jsdc.forof.getLast(isDestruct) : join(node.leaf(index - 1));
                    var obj = self.jsdc.uid();
                    //插入var
                    if(index == 4) {
                      eventbus.on(itstmt.nid(), function(node, start) {
                        if(start) {
                          self.jsdc.insert('var ' + id + ';', self.hash[nid].pos);
                        }
                      });
                      self.jsdc.ignore(node.leaf(index - 2), 'gen37');
                    }
                    self.jsdc.ignore(node.leaf(index - 1), 'gen38');
                    self.jsdc.ignore(node.leaf(index), 'gen39');
                    eventbus.on(itstmt.leaf(index + 1).nid(), function(node, start) {
                      if(start) {
                        self.jsdc.append('var ' + obj + '=');
                        top = self.hash[nid];
                      }
                      else {
                        self.jsdc.appendBefore(',' + next);
                        self.jsdc.appendBefore('=' + obj + '.next();');
                        endTemp = ++top.index2;
                        self.jsdc.appendBefore('case ' + endTemp + ':');
                        self.jsdc.appendBefore(top.state + '=');
                        self.jsdc.appendBefore(next + '.done' + '?');
                        iterator = ++top.index2;
                        itTemp = ++top.index2;
                        itEndTemp = ++top.index2;
                        self.jsdc.appendBefore(itTemp + ':' + itEndTemp + ';break;');
                        //供yield判断
                        itstmt.done = next + '.done';
                      }
                    });
                    eventbus.on(block.nid(), function(node, start) {
                      if(start) {
                        self.jsdc.append('case ' + iterator + ':');
                        self.jsdc.append(next + '=' + obj + '.next();');
                        self.jsdc.append(top.state + '=' + endTemp);
                        self.jsdc.append(';break;case ' + itTemp + ':');
                        self.jsdc.append(id + '=' + next + '.value;');
                        if(isDestruct) {
                          var ret = {
                            o: id,
                            s: '',
                            pos: 4,
                            append: function(s) {
                              this.s += s;
                            },
                            appendBefore: function(s) {
                              this.s += s;
                            }
                          };
                          self.jsdc.forof.assign(isDestruct, ret);
                          self.jsdc.appendBefore(ret.s);
                        }
                      }
                      else {
                        self.jsdc.appendBefore(top.state + '=' + endTemp);
                        self.jsdc.appendBefore(';break;case ' + itEndTemp + ':');
                      }
                    });
                    break;
                }
              }
              //普通for语句
              else {
                loopTemp = self.jsdc.uid();
                var block = itstmt.last();
                if(block.name() == JsNode.BLOCKSTMT) {
                  self.jsdc.ignore(block.first().first(), 'gen32');
                  self.jsdc.ignore(block.first().last(), 'gen33');
                }
                eventbus.on(itstmt.nid(), function(node, start) {
                  if(start) {
                    self.jsdc.insert('var ' + loopTemp + ';', self.hash[nid].pos);
                    top = self.hash[nid];
                    endTemp = ++top.index2;
                    itTemp = ++top.index2;
                    itEndTemp = ++top.index2;
                  }
                });
                var expr1 = 0;
                //for(;expr1
                if(itstmt.leaf(2).name() == JsNode.TOKEN
                  && itstmt.leaf(2).token().content() == ';') {
                  if(itstmt.leaf(3).name() != JsNode.TOKEN
                    || itstmt.leaf(3).token().content() != ';') {
                    expr1 = 3;
                  }
                }
                //for(expr0;expr1
                else if(itstmt.leaf(4).name() != JsNode.TOKEN
                  || itstmt.leaf(4).token().content() != ';') {
                  expr1 = 4;
                }
                if(expr1) {
                  eventbus.on(itstmt.leaf(expr1).nid(), function(node, start) {
                    if(start) {
                      self.jsdc.append('case ' + endTemp + ':');
                      self.jsdc.append(top.state + '=');
                      self.jsdc.append('(' + loopTemp + '=');
                    }
                    else {
                      self.jsdc.appendBefore(')?' + itTemp + ':' + itEndTemp);
                    }
                  });
                }
                else {
                  eventbus.on(itstmt.nid(), function(node, start) {
                    if(start) {
                      self.jsdc.append('case ' + endTemp + ':');
                    }
                  });
                }
                var expr2 = 0;
                if(expr1
                  && (itstmt.leaf(expr1 + 2).name() != JsNode.TOKEN
                    || itstmt.leaf(expr1 + 2).token().content() != ')')) {
                  expr2 = expr1 + 2;
                }
                else if(
                  !expr1
                  && (itstmt.leaf(4).name() != JsNode.TOKEN
                    || itstmt.leaf(4).token().content() != ')')) {
                  expr2 = 4;
                }
                if(expr2) {
                  eventbus.on(itstmt.leaf(expr2).nid(), function(node, start) {
                    if(start) {
                      self.jsdc.append('case ' + itTemp + ':');
                    }
                    else {
                      self.jsdc.appendBefore(';');
                    }
                  });
                }
                else {
                  eventbus.on(expr1 ? itstmt.leaf(expr1).nid() : itstmt.nid(), function(node, start) {
                    if(!start) {
                      self.jsdc.append(';case ' + itTemp + ':');
                    }
                  });
                }
                eventbus.on(block.nid(), function(node, start) {
                  if(start) {
                    //供yield判断
                    itstmt.done = '!' + loopTemp;
                  }
                  else {
                    self.jsdc.appendBefore(top.state + '=' + endTemp);
                    self.jsdc.appendBefore(';break;case ' +  itEndTemp + ':');
                  }
                });
              }
              break;
            case 'while':
              self.jsdc.ignore(itstmt.first());
              loopTemp = self.jsdc.uid();
              var block = itstmt.last();
              if(block.name() == JsNode.BLOCKSTMT) {
                self.jsdc.ignore(block.first().first(), 'gen32');
                self.jsdc.ignore(block.first().last(), 'gen33');
              }
              eventbus.on(itstmt.nid(), function(node, start) {
                if(start) {
                  self.jsdc.insert('var ' + loopTemp + ';', self.hash[nid].pos);
                  top = self.hash[nid];
                  endTemp = top.index2;
                  self.jsdc.append(top.state + '=');
                }
              });
              eventbus.on(itstmt.leaf(2).nid(), function(node, start) {
                if(start) {
                  self.jsdc.append(loopTemp + '=');
                }
              });
              eventbus.on(block.nid(), function(node, start) {
                if(start) {
                  itTemp = ++top.index2;
                  itEndTemp = ++top.index2;
                  self.jsdc.append('?' + itTemp + ':' + itEndTemp);
                  self.jsdc.append(';break;case ' + itTemp + ':');
                  //供yield判断
                  itstmt.done = '!' + loopTemp;
                }
                else {
                  self.jsdc.appendBefore(top.state + '=' + endTemp);
                  self.jsdc.appendBefore(';break;case ' +  itEndTemp + ':');
                }
              });
              break;
            case 'do':
              loopTemp = self.jsdc.uid();
              //供yield判断
              itstmt.done = '!' + loopTemp;
              self.jsdc.ignore(itstmt.first());
              self.jsdc.ignore(itstmt.leaf(2));
              var block = itstmt.leaf(1);
              if(block.name() == JsNode.BLOCKSTMT) {
                self.jsdc.ignore(block.first().first(), 'gen34');
                self.jsdc.ignore(block.first().last(), 'gen35');
              }
              eventbus.on(itstmt.nid(), function(node, start) {
                if(start) {
                  self.jsdc.insert('var ' + loopTemp + ';', self.hash[nid].pos);
                }
                else {
                  self.jsdc.appendBefore('?' + itTemp + ':' + itEndTemp);
                  self.jsdc.appendBefore(';break;case ' + itEndTemp + ':');
                }
              });
              eventbus.on(itstmt.leaf(4).nid(), function(node, start) {
                if(start) {
                  self.jsdc.append(loopTemp + '=');
                }
              });
              eventbus.on(block.nid(), function(node, start) {
                if(start) {
                  top = self.hash[nid];
                  itTemp = ++top.index2;
                  endTemp = ++top.index2;
                  self.jsdc.append('case ' + itTemp + ':');
                }
                else {
                  if(!self.jsdc.endsWith(';')
                    && !self.jsdc.endsWith(':')
                    && !self.jsdc.endsWith('{')
                    && !self.jsdc.endsWith('}')
                    && !self.jsdc.endsWith('\n')) {
                    self.jsdc.appendBefore(';');
                  }
                  self.jsdc.appendBefore(top.state + '=' + endTemp);
                  itEndTemp = ++top.index2;
                  self.jsdc.appendBefore(';break;case ' + endTemp + ':');
                  self.jsdc.appendBefore(top.state + '=');
                }
              });
              break;
          }
          break;
        //忽略这些节点中的所有逻辑
        case JsNode.CLASSDECL:
        case JsNode.CLASSEXPR:
        case JsNode.FNDECL:
        case JsNode.FNEXPR:
        case JsNode.GENDECL:
        case JsNode.GENEXPR:
        case JsNode.METHOD:
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.pre(leaf, nid, bid, res);
      });
    }
  },
  belong: function(node) {
    var res = [];
    while(node = node.parent()) {
      switch(node.name()) {
        case JsNode.IFSTMT:
        case JsNode.ITERSTMT:
          res.push(node);
        case JsNode.GENDECL:
        case JsNode.GENEXPR:
          break;
      }
    }
    return res;
  },
  getLast: function(node) {
    while(node = node.last()) {
      if(node.name() == JsNode.TOKEN) {
        return node;
      }
    }
  },
  ignoreNext: function(node, value) {
    node = this.getLast(node);
    if(node) {
      var token = node.token();
      while(token = token.next()) {
        if(token.type() == Token.COMMENT
          || token.type() == Token.BLANK
          || token.type() == Token.LINE) {
          continue;
        }
        if(token.content() == value) {
          this.jsdc.ignore(token, 'gen36');
          return;
        }
        else {
          return;
        }
      }
    }
  }
});

module.exports = Generator;});