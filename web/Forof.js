define(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  var Token = homunculus.getClass('Token');
  
  var Class = require('./util/Class');
  var join = require('./join');
  
  var Forof = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
    this.pos = {};
    this.destruct = {};
  }).methods({
    parse: function(node, start) {
      //有可能被Generator中改写过
      if(node.gen) {
        return;
      }
      if(start) {
        if(node.first().token().content() == 'for') {
          var of = node.leaf(3);
          if(of.name() == JsNode.TOKEN
            && of.token().content() == 'of') {
            this.pos[node.nid()] = 3;
            //存放临时id供block首改写引用
            var leaf = node.leaf(2);
            if(leaf.name() == JsNode.PRMREXPR
              && leaf.size() == 1
              && [JsNode.OBJLTR, JsNode.ARRLTR].indexOf(leaf.first().name()) > -1) {
              this.destruct[node.nid()] = leaf.first();
              this.hash[node.nid()] = this.getLast(leaf.first());
              this.jsdc.ignore(leaf, 'forof1');
            }
            else {
              this.hash[node.nid()] = true;
            }
            this.jsdc.ignore(of, 'forof2');
          }
          //for(var forbind of中为4
          else {
            of = node.leaf(4);
            if(of.name() == JsNode.TOKEN
              && of.token().content() == 'of') {
              this.pos[node.nid()] = 4;
              this.destruct[node.nid()] = node.leaf(3);
              //存放临时id供block首改写引用
              this.hash[node.nid()] = this.getLast(node.leaf(3));
              this.jsdc.ignore(of, 'forof3');
              this.jsdc.ignore(node.leaf(3), 'forof4');
            }
          }
        }
      }
      else if(this.hash.hasOwnProperty(node.nid())) {
        var last = node.last();
        if(last.name() != JsNode.BLOCKSTMT) {
          //}闭合
          this.jsdc.appendBefore('}');
        }
      }
    },
    of: function(node) {
      var parent = node.parent();
      if(parent.name() == JsNode.ITERSTMT
        && this.hash.hasOwnProperty(parent.nid())) {
        if(typeof this.hash[parent.nid()] == 'string') {
          this.jsdc.append(this.hash[parent.nid()]);
        }
        this.jsdc.append('=');
      }
    },
    prts: function(node, start) {
      var parent = node.parent();
      if(parent.name() == JsNode.ITERSTMT
        && this.hash.hasOwnProperty(parent.nid())) {
        if(start) {
          this.jsdc.append('.next();!');
          var k;
          if(typeof this.hash[parent.nid()] == 'string') {
            k = this.hash[parent.nid()];
          }
          else {
            k = parent.leaf(2);
            //forof的varstmt只能有一个id，其它为mmbexpr或destruct
            if(k.name() == JsNode.VARSTMT) {
              k = k.last().first().first().token().content();
            }
            else {
              k = join(k);
            }
          }
          var v = join(parent.leaf(this.pos[parent.nid()]+1));
          this.jsdc.append(k + '.done;');
          this.jsdc.append(k + '=' + v + '.next()');
        }
        else {
          //for of的语句如果省略{}则加上
          var last = parent.last();
          if(last.name() != JsNode.BLOCKSTMT) {
            this.jsdc.appendBefore('{');
            this.assign(parent);
          }
        }
      }
    },
    block: function(node) {
      var parent = node.parent();
      if(parent.name() == JsNode.BLOCK) {
        parent = parent.parent();
        if(parent.name() == JsNode.BLOCKSTMT) {
          parent = parent.parent();
          if(parent.name() == JsNode.ITERSTMT
            && this.hash.hasOwnProperty(parent.nid())) {
            this.assign(parent);
          }
        }
      }
    },
    assign: function(node, ret) {
      var k;
      if(ret) {
        k = ret.o;
      }
      else if(typeof this.hash[node.nid()] == 'string') {
        k = this.hash[node.nid()];
      }
      else {
        k = node.leaf(2);
        //forof的varstmt只能有一个id，其它为mmbexpr或destruct
        if(k.name() == JsNode.VARSTMT) {
          k = k.last().first().first().token().content();
        }
        else {
          k = join(k);
        }
      }
      if(ret) {
        if(ret.pos == 4) {
          this.jsdc.destruct.parse(node, true, ret);
          this.jsdc.destruct.parse(node, false, ret);
        }
        else {
          this.jsdc.destruct.expr(node, true, ret);
          this.jsdc.destruct.expr(node, false, ret);
        }
        return ret.s;
      }
      else {
        this.jsdc.append(k + '=' + k + '.value;');
        if(this.destruct.hasOwnProperty(node.nid())) {
          var ret2 = {
            o: k,
            s: '',
            append: function(s) {
              this.s += s;
            },
            appendBefore: function(s) {
              this.s += s;
            }
          };
          if(this.pos[node.nid()] == 4) {
            this.jsdc.destruct.parse(this.destruct[node.nid()], true, ret2);
            this.jsdc.destruct.parse(this.destruct[node.nid()], false, ret2);
          }
          else {
            this.jsdc.destruct.expr(this.destruct[node.nid()], true, ret2);
            this.jsdc.destruct.expr(this.destruct[node.nid()], false, ret2);
          }
          this.jsdc.append(ret2.s);
        }
      }
    },
    getLast: function(node) {
      if(node.name() == JsNode.ARRLTR
        || node.name() == JsNode.ARRBINDPAT) {
        return this.getArrLast(node);
      }
      else {
        return this.getObjLast(node);
      }
    },
    getArrLast: function(node) {
      for(var leaves = node.leaves(), i = leaves.length - 2; i > 0; i--) {
        var temp = leaves[i];
        var s = temp.name();
        if(s == JsNode.SINGLENAME
          || s == JsNode.ASSIGNEXPR) {
          return temp.first().first().token().content();
        }
        else if(s == JsNode.PRMREXPR) {
          temp = temp.first();
          s = temp.name();
          if(s == JsNode.TOKEN) {
            return temp.token().content();
          }
          else {
            return this.getLast(temp);
          }
        }
        else if(s == JsNode.BINDELEM) {
          return this.getLast(temp.first());
        }
      }
    },
    getObjLast: function(node) {
      for(var leaves = node.leaves(), i = leaves.length - 2; i > 0; i--) {
        var temp = leaves[i];
        var s = temp.name();
        if(s == JsNode.BINDPROPT) {
          leaves = temp.leaves();
          if(leaves.length < 3) {
            s = leaves[0].name();
            return leaves[0].first().first().token().content();
          }
          else {
            temp = leaves[2];
            s = temp.name();
            if(s == JsNode.SINGLENAME) {
              return temp.first().first().token().content();
            }
            else if(s == JsNode.BINDELEM) {
              return this.getLast(temp.first());
            }
          }
        }
        else if(s == JsNode.PROPTDEF) {
          leaves = temp.leaves();
          if(leaves.length < 3) {
            return leaves[0].token().content();
          }
          else {
            temp = leaves[2].first();
            s = temp.name();
            if(s == JsNode.TOKEN) {
              return temp.token().content();
            }
            else if(s == JsNode.PRMREXPR) {
              return temp.first().token().content();
            }
            else {
              return this.getLast(temp);
            }
          }
        }
      }
    }
  });
  
  module.exports = Forof;
});