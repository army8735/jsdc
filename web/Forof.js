define(function(require, exports, module){var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');
var Token = homunculus.getClass('Token');

var Class = require('./util/Class');
var join = require('./join');

var Forof = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.hash = {};
  this.hash2 = {};
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
        //of只会出现在3或4位
        var index = 0;
        if(node.leaf(3).name() == JsNode.TOKEN
          && node.leaf(3).token().content() == 'of') {
          index = 3;
        }
        else if(node.leaf(4).name() == JsNode.TOKEN
          && node.leaf(4).token().content() == 'of') {
          index = 4;
        }
        if(index == 0) {
          return;
        }
        var of = node.leaf(index);
        var leaf = node.leaf(index - 1);
        var temp = this.jsdc.uid();
        var ref = join(node.leaf(index + 1));
        this.jsdc.append('var ' + temp + '=' + ref);
        this.hash2[node.nid()] = temp;
        //如果是var解构
        if([JsNode.OBJBINDPAT, JsNode.ARRBINDPAT].indexOf(leaf.name()) > -1) {
          this.destruct[node.nid()] = leaf;
          this.hash[node.nid()] = this.getLast(leaf);
          this.jsdc.ignore(leaf, 'forof1');
        }
        //prmrexpr解构
        else if(leaf.name() == JsNode.PRMREXPR
          && leaf.size() == 1
          && [JsNode.OBJLTR, JsNode.ARRLTR].indexOf(leaf.first().name()) > -1) {
          this.destruct[node.nid()] = leaf.first();
          this.hash[node.nid()] = this.getLast(leaf.first());
          this.jsdc.ignore(leaf, 'forof1');
        }
        else {
          this.hash[node.nid()] = true;
        }
        this.pos[node.nid()] = index;
        this.jsdc.ignore(of, 'forof2');
        this.jsdc.ignore(node.leaf(index + 1), 'forof3');
        this.jsdc.append(';');
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
        this.jsdc.append(this.hash2[parent.nid()] + '[Symbol.iterator]().next();!');
        var index = this.pos[parent.nid()];
        var k;
        //解构
        if(typeof this.hash[parent.nid()] == 'string') {
          k = this.hash[parent.nid()];
        }
        else {
          k = parent.leaf(index - 1);
          //forof的var后只能是bindid或者解构
          k = k.first().token().content();
        }
        this.jsdc.append(k + '.done;');
        this.jsdc.append(k + '=' + this.hash2[parent.nid()] + '.next()');
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
      var index = this.pos[node.nid()];
      k = node.leaf(index - 1);
      //只会是bindid或解构
      if(k.name() == JsNode.BINDID) {
        k = k.first().token().content();
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

module.exports = Forof;});