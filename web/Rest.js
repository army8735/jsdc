define(function(require, exports, module){var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');
var Token = homunculus.getClass('Token');

var Class = require('./util/Class');
var join = require('./join');
var eventbus = require('./eventbus');

var Rest = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.hash = {};
  this.hash2 = {};
  this.hash3 = {};
  this.hash4 = {};
  this.hash5 = {};
}).methods({
  param: function(fmparams) {
    if(fmparams.name() == JsNode.FMPARAMS && fmparams.size()) {
      var last = fmparams.last();
      var fnbody = fmparams.next().next().next();
      if(last.name() == JsNode.BINDREST) {
        var rest = last.first();
        this.jsdc.ignore(rest, 'rest1');
        this.hash[fnbody.nid()] = {
          index: Math.floor(fmparams.size() / 2),
          token: last.last().first().token()
        };
      }
    }
  },
  enter: function(fnbody) {
    if(this.hash.hasOwnProperty(fnbody.nid())) {
      var o = this.hash[fnbody.nid()];
      var index = o.index;
      var id = o.token.content();
      this.jsdc.append(id + '=[].slice.call(arguments, ' + index + ');');
    }
    else {
      var cncsbody = fnbody.parent();
      if(cncsbody.name() == JsNode.CNCSBODY) {
        var arrowFn = cncsbody.parent();
        if(arrowFn.name() == JsNode.ARROWFN) {
          if(this.hash5.hasOwnProperty(arrowFn.nid())) {
            var o = this.hash5[arrowFn.nid()];
            var index = o.index;
            var id = o.token.content();
            this.jsdc.append(id + '=[].slice.call(arguments, ' + index + ');');
          }
        }
      }
    }
  },
  arrowParam: function(arparam) {
    var arrowFn = arparam.parent();
    var cpeapl = arparam.first();
    if(cpeapl && cpeapl.name() == JsNode.CPEAPL) {
      var last = cpeapl.last().prev();
      var prev = last.prev();
      if(last.name() == JsNode.BINDID && prev.isToken() && prev.token().content() == '...') {
        this.jsdc.ignore(prev, 'rest5');
        var index = 0;
        if(cpeapl.leaf(1).name() == JsNode.EXPR) {
          index = Math.floor(cpeapl.leaf(1).size() / 2) + 1;
        }
        this.hash5[arrowFn.nid()] = {
          index: index,
          token: last.first().token()
        };
      }
    }
  },
  cncsbody: function(node) {
    var arrowFn = node.parent();
    if(this.hash5.hasOwnProperty(arrowFn.nid())) {
      if(node.size() == 1) {
        var o = this.hash5[arrowFn.nid()];
        var index = o.index;
        var id = o.token.content();
        this.jsdc.append('{' + id + '=[].slice.call(arguments, ' + index + ');');
        this.jsdc.append('return ');
        node.rest = true;
      }
    }
  },
  expr: function(node) {
    var args = node.last();
    var arglist = args.leaf(1);
    var self = this;
    if(arglist.size() > 1) {
      var last = arglist.last();
      var spread = last.prev();
      if(spread.name() == JsNode.TOKEN && spread.token().content() == '...') {
        var first = node.first();
        var needTemp = self.needTemp(first).ret;
        var temp = needTemp ? self.jsdc.uid() : '';
        self.hash2[node.nid()] = {
          node: first,
          needTemp: needTemp,
          temp: needTemp ? temp : ''
        };
        //主表达式中含有生成的对象，不是直接引用，需创建一个临时变量保存引用
        if(needTemp) {
          self.jsdc.append('function(){var ' + temp + '=');
          var first = first.first();
          eventbus.on(first.nid(), function(node2, start) {
            if(!start) {
              self.jsdc.appendBefore(';return ' + temp);
            }
          });

        }
        self.jsdc.ignore(arglist, 'rest2');
      }
    }
  },
  newc: function(node, start) {
    var self = this;
    if(start) {
      var args = node.last();
      var arglist = args.leaf(1);
      if(arglist && arglist.size() > 1) {
        var last = arglist.last();
        var spread = last.prev();
        if(spread.name() == JsNode.TOKEN && spread.token().content() == '...') {
          var cnameNode = node.leaf(1);
          var cname = join(cnameNode);
          var first = node.first();
          self.hash4[node.nid()] = {
            node: first,
            cname: cname
          };
          self.jsdc.ignore(cnameNode, 'rest3');
          self.jsdc.ignore(arglist, 'rest4');
        }
      }
    }
    else if(self.hash4.hasOwnProperty(node.nid())) {
      self.jsdc.appendBefore('()');
    }
  },
  needTemp: function(node, res) {
    res = res || { ret: false };
    if(res.ret) {
      return res;
    }
    var isToken = node.name() == JsNode.TOKEN;
    if(!isToken) {
      if([JsNode.CALLEXPR, JsNode.NEWEXPR].indexOf(node.first().name()) > -1) {
        res.ret = true;
      }
    }
    return res;
  },
  args: function(node, start) {
    var parent = node.parent();
    if(parent.name() == JsNode.CALLEXPR && this.hash2.hasOwnProperty(parent.nid())) {
      start && this.jsdc.append('.apply');
    }
    else if(parent.name() == JsNode.NEWEXPR && this.hash4.hasOwnProperty(parent.nid())) {
      start ? this.jsdc.append('(Function.prototype.bind.apply') : this.jsdc.appendBefore(')');
    }
  },
  arglist: function(node) {
    var parent = node.parent().parent();
    if(parent.name() == JsNode.CALLEXPR && this.hash2.hasOwnProperty(parent.nid())) {
      var o = this.hash2[parent.nid()];
      if(o.needTemp) {
        //主表达式中含有生成的对象，不是直接引用，使用临时变量引用
        this.jsdc.append(o.temp);
      }
      else {
        //主表达式无需设置apply的context，成员需设
        var mmb = this.hash2[parent.nid()].node;
        this.jsdc.append(mmb.name() == JsNode.MMBEXPR ? join(mmb.first()) : 'this');
      }
      //用数组来concat可变参数，注意前面可能存在的固定参数需带上
      this.jsdc.append(', [');
      var leaves = node.leaves();
      for(var i = 0; i < leaves.length - 3; i++) {
        this.jsdc.append(join(leaves[i]));
      }
      this.jsdc.append(']');
      this.jsdc.append('.concat(function(){');
      var last = node.last();
      var isPrm = last.name() == JsNode.PRMREXPR;
      var v;
      if(isPrm) {
        v = last.first().token().content();
      }
      else {
        v = join(last);
      }
      var temp = this.jsdc.uid();
      var temp2 = this.jsdc.uid();
      this.jsdc.append('var ' + temp + '=[],' + temp2);
      if(!isPrm) {
        var temp3 = this.jsdc.uid();
        this.jsdc.append(',' + temp3 + '=' + v);
      }
      this.jsdc.append(';while(!(' + temp2 + '=' + (isPrm ? v : temp3) + '.next()).done)');
      this.jsdc.append(temp + '.push(' + temp2 + '.value' + ')');
      this.jsdc.append(';return ' + temp + '}())');
      if(o.needTemp) {
        //主表达式中含有生成的对象，不是直接引用
        this.jsdc.append(')}(');
      }
    }
    else if(parent.name() == JsNode.NEWEXPR && this.hash4.hasOwnProperty(parent.nid())) {
      var o = this.hash4[parent.nid()];
      this.jsdc.append(o.cname);
      //用数组来concat可变参数，注意前面可能存在的固定参数需带上
      this.jsdc.append(', [');
      var leaves = node.leaves();
      for(var i = 0; i < leaves.length - 3; i++) {
        this.jsdc.append(join(leaves[i]));
      }
      this.jsdc.append(']');
      this.jsdc.append('.concat(function(){');
      var last = node.last();
      var isPrm = last.name() == JsNode.PRMREXPR;
      var v;
      if(isPrm) {
        v = last.first().token().content();
      }
      else {
        v = join(last);
      }
      var temp = this.jsdc.uid();
      var temp2 = this.jsdc.uid();
      this.jsdc.append('var ' + temp + '=[],' + temp2);
      if(!isPrm) {
        var temp3 = this.jsdc.uid();
        this.jsdc.append(',' + temp3 + '=' + v);
      }
      this.jsdc.append(';while(!(' + temp2 + '=' + (isPrm ? v : temp3) + '.next()).done)');
      this.jsdc.append(temp + '.push(' + temp2 + '.value' + ')');
      this.jsdc.append(';return ' + temp + '}())');
    }
  },
  comma: function(node) {
    var next = node.next();
    if(next.name() == JsNode.SPREAD && !node.destruct) {
      this.jsdc.ignore(node);
    }
  },
  spread: function(node, start) {
    if(node.destruct || node.parent().destruct) {
      return;
    }
    if(start) {
      var last = node.last();
      var s = join(last);
      this.hash3[node.nid()] = {
        isStr: last.name() == JsNode.PRMREXPR
          && last.first().name() == JsNode.TOKEN
          && last.first().token().type() == Token.STRING,
        isPrm: last.name() == JsNode.PRMREXPR,
        value: join(last)
      };
      this.jsdc.ignore(node);
    }
    else if(this.hash3.hasOwnProperty(node.nid())) {
      var o = this.hash3[node.nid()];
      var prev = node.prev();
      //开始的[
      if(prev.token().content() == '[') {
        this.jsdc.appendBefore(']');
      }
      //中间情况是,号
      else {
        prev = prev.prev();
        if(prev.name() != JsNode.SPREAD) {
          this.jsdc.appendBefore(']');
          //隔了一个普通数组值之前又是spread，即2个spread不相邻
          prev = prev.prev();
          if(prev) {
            prev = prev.prev();
            if(prev && prev.name() == JsNode.SPREAD) {
              this.jsdc.appendBefore(')');
            }
          }
        }
      }
      this.jsdc.appendBefore('.concat(');
      if(o.isStr) {
        this.jsdc.appendBefore(o.value);
        this.jsdc.appendBefore('.split("")');
      }
      else {
        this.jsdc.appendBefore('function(){var ');
        var temp = this.jsdc.uid();
        var temp2 = this.jsdc.uid();
        this.jsdc.appendBefore(temp);
        this.jsdc.appendBefore('=[],' + temp2);
        var temp3;
        if(!o.isPrm) {
          temp3 = this.jsdc.uid();
          this.jsdc.appendBefore(',' + temp3 + '=' + o.value);
        }
        this.jsdc.appendBefore(';while(!(' + temp2 + '=' + (o.isPrm ? o.value : temp3) + '.next()).done)');
        this.jsdc.appendBefore(temp + '.push(' + temp2 + '.value);return ' + temp + '}()');
      }
      this.jsdc.appendBefore(')');
      var next = node.next();
      if(next.token().content() == ']') {
        this.jsdc.ignore(next);
      }
      else {
        this.jsdc.ignore(next);
        next = next.next();
        if(next.name() != JsNode.SPREAD) {
          this.jsdc.appendBefore('.concat([');
        }
      }
    }
  }
});

module.exports = Rest;
});