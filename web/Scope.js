define(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  
  var Class = require('./util/Class');
  var SCOPE = {};
  SCOPE[JsNode.BLOCK] =
    SCOPE[JsNode.FNBODY] = true;
  var NOT_ABS_BLOCK = {};
    NOT_ABS_BLOCK[JsNode.ITERSTMT] =
      NOT_ABS_BLOCK[JsNode.IFSTMT] = true;
  
  var Scope = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
    this.history = {};
    this.index = [jsdc.res.length];
  }).methods({
    parse: function(node) {
      this.recursion(node);
    },
    recursion: function(node) {
      var self = this;
      var isToken = node.name() == JsNode.TOKEN;
      if(!isToken) {
        var name = node.name();
        //每个{}作用域记录是否有lexdecl或fn或generator
        if(name == JsNode.LEXDECL
          || name == JsNode.FNDECL
          || name == JsNode.GENDECL) {
          var parent = self.closest(node);
          //全局lexdecl没有作用域无需记录，fnbody的也无需记录
          if(parent && parent.name() != JsNode.FNBODY) {
            self.hash[parent.nid()] = true;
          }
        }
        else if(name == JsNode.BLOCKSTMT
          && !NOT_ABS_BLOCK.hasOwnProperty(node.parent().name())) {
          self.hash[node.first().nid()] = true;
        }
        node.leaves().forEach(function(leaf) {
          self.recursion(leaf);
        });
      }
    },
    prevar: function(varstmt) {
      var self = this;
      var gen = self.inGen(varstmt);
      //genarator的忽略
      if(gen) {
        varstmt.gen = gen;
        return;
      }
      var parent = self.closest(varstmt);
      //插入声明的变量到作用域开始，并删除这个var
      var i = self.index[self.index.length - 1];
      self.history[i] = self.history[i] || {};
      var his = self.history[i];
      var vardecls = varstmt.leaves().filter(function(o, i) {
        return i % 2 == 1;
      });
      vardecls.forEach(function(vardecl) {
        if(vardecl.first().name() != JsNode.BINDID
          || parent
            && self.hash[parent.nid()]) {
          self.join(vardecl).forEach(function(id) {
            if(!his.hasOwnProperty(id)) {
              his[id] = true;
              self.jsdc.insert('var ' + id + ';', i);
            }
          });
          if(vardecl.first().name() == JsNode.BINDID) {
            self.jsdc.ignore(varstmt.first().token());
          }
          else {
            //destruct需忽略前后可能的,再改为; var也需忽略
            self.jsdc.ignore(vardecl.prev());
            var next = vardecl.next();
            if(next.token().content() == ',') {
              self.jsdc.ignore(next);
            }
          }
        }
      });
    },
    join: function(node) {
      var first = node.first();
      var res = [];
      switch(first.name()) {
        case JsNode.BINDID:
          res.push(first.first().token().content());
          break;
        case JsNode.ARRBINDPAT:
        case JsNode.OBJBINDPAT:
          res = res.concat(this.jsdc.destruct.getIds(first));
          break;
      }
      return res;
    },
    enter: function(node) {
      this.index.push(this.jsdc.res.length);
    },
    leave: function(node) {
      this.index.pop();
    },
    block: function(node, start) {
      switch(node.name()) {
        case JsNode.BLOCK:
          node = node.parent();
          var pname = node.name();
          if(pname == JsNode.BLOCKSTMT) {
            pname = node.parent().name();
            //纯block父节点为blockstmt且祖父节点不是iteratorstmt,ifstmt
            //try,catch,final已在父节点不是blockstmt排除
            if(!NOT_ABS_BLOCK.hasOwnProperty(pname)
              || this.hash.hasOwnProperty(node.nid())) {
              if(start) {
                this.jsdc.append('!function()');
              }
              else {
                this.jsdc.appendBefore('();');
              }
            }
          }
          break;
        //{和}需要添加匿名函数，排除纯block，即父节点不为blockstmt或祖父节点不为iteratorstmt,ifstmt
        case JsNode.TOKEN:
          node = node.parent();
          if(node.name() == JsNode.BLOCK
            && this.hash.hasOwnProperty(node.nid())) {
            node = node.parent();
            if(node.name() != JsNode.BLOCKSTMT
              || NOT_ABS_BLOCK.hasOwnProperty(node.parent().name())) {
              if(start) {
                this.jsdc.append('!function(){');
              }
              else {
                this.jsdc.appendBefore('}();');
              }
            }
          }
          break;
      }
    },
    closest: function(node) {
      var parent = node;
      while(parent = parent.parent()) {
        if(SCOPE.hasOwnProperty(parent.name())) {
          return parent;
        }
      }
    },
    inGen: function(node) {
      var parent = node;
      while(parent = parent.parent()) {
        switch(parent.name()) {
          case JsNode.GENDECL:
            return parent;
          case JsNode.FNDECL:
          case JsNode.FNEXPR:
          case JsNode.CLASSDECL:
          case JsNode.CLASSEXPR:
          case JsNode.METHOD:
            return false;
        }
      }
    }
  });
  
  module.exports = Scope;
  
});