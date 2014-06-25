define(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  var Token = homunculus.getClass('Token');
  
  var Class = require('./util/Class');
  
  var Module = Class(function(jsdc) {
    this.jsdc = jsdc;
  }).methods({
    parse: function(t) {
    },
    module: function(node) {
      this.jsdc.ignore(node, 'module1');
      this.jsdc.append('var ');
      this.jsdc.append(node.leaf(1).first().token().content());
      this.jsdc.append('=require(');
      this.jsdc.append(node.leaf(2).last().token().content());
      this.jsdc.append(');');
    },
    import: function(node) {
      var self = this;
      self.jsdc.ignore(node, 'module2');
      var one = node.leaf(1);
      //import "string"
      if(one.name() == JsNode.TOKEN
        && one.token().type() == Token.STRING) {
        self.jsdc.append('require(');
        self.jsdc.append(one.token().content());
        self.jsdc.append(');');
      }
      else {
        var ids = getIds(one);
        var temp = self.jsdc.uid();
        Object.keys(ids).forEach(function(k) {
          self.jsdc.append('var ' + k + ';');
        });
        self.jsdc.append('!function(){var ' + temp);
        self.jsdc.append('=require(');
        var last = node.last();
        if(last.name() != JsNode.FROMCAULSE) {
          last = last.prev();
        }
        self.jsdc.append(last.last().token().content());
        self.jsdc.append(');');
        Object.keys(ids).forEach(function(k) {
          self.jsdc.append(k);
          self.jsdc.append('=' + temp + '.');
          self.jsdc.append(ids[k]);
          self.jsdc.append(';');
        });
        self.jsdc.append('}();');
      }
    },
    export: function(node) {
      var s = node.leaf(1).name();
      switch(s) {
        case JsNode.TOKEN:
          s = node.leaf(1).token().content();
          if(s == '*') {
            var temp = this.jsdc.uid();
            this.jsdc.append('!function(){');
            this.jsdc.append('var ' + temp + '=require(');
            this.jsdc.append(node.leaf(2).last().token().content());
            this.jsdc.append(');');
            this.jsdc.append('Object.keys(' + temp + ').forEach(function(k){');
            this.jsdc.append('module.exports[k]=' + temp + '[k];');
            this.jsdc.append('});}();');
            this.jsdc.ignore(node, 'module3');
          }
          else if(s == 'default') {
            this.jsdc.append('module.exports=');
            this.jsdc.ignore(node.leaf(0), 'module4');
            this.jsdc.ignore(node.leaf(1), 'module5');
          }
          break;
        case JsNode.VARSTMT:
        case JsNode.LEXDECL:
          var varstmt = node.leaf(1);
          var vardecl = varstmt.leaf(1);
          this.jsdc.append('var ');
          var id = vardecl.first().first().token().content();
          this.jsdc.append(id);
          this.jsdc.append(';exports.' + id + '=');
          this.jsdc.ignore(varstmt.first(), 'module6');
          this.jsdc.ignore(node.first(), 'module7');
          break;
        case JsNode.FNDECL:
        case JsNode.CLASSDECL:
          var id = node.last().leaf(1).first().token().content();
          this.jsdc.append('exports.' + id + '=');
          this.jsdc.append(id);
          this.jsdc.append(';');
          this.jsdc.ignore(node.first(), 'module8');
          break;
      }
    },
    enter: function() {
      if(this.jsdc.define()) {
        var s = /(?:\/\/.*\r?\n)?([\s]+)$/.exec(this.jsdc.res);
        if(s) {
          this.jsdc.insert('define(function(require,exports,module){', this.jsdc.res.length - s[1].length);
        }
        else {
          this.jsdc.append('define(function(require,exports,module){');
        }
      }
  },
    leave: function() {
      this.jsdc.define() && this.jsdc.append('});');
    }
  });
  
  function getIds(node) {
    var res = {};
    node.leaves().forEach(function(leaf, i) {
      if(i % 2 == 0) {
        if(leaf.name() == JsNode.NAMEIMPORT) {
          leaf.leaves().forEach(function(leaf, i) {
            if(i % 2 == 1) {
              var s = leaf.first().token().content();
              if(leaf.size() == 1) {
                res[s] = s;
              }
              else {
                res[leaf.last().first().token().content()] = s;
              }
            }
          });
        }
        else {
          var s = leaf.token().content();
          res[s] = s;
        }
      }
    });
    return res;
  }
  
  module.exports = Module;
  
});