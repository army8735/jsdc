var expect = require('expect.js');
var JSDC = require('../');

describe('api', function() {
  it('#parse', function() {
    var jsdc = new JSDC();
    expect(jsdc.parse).to.be.a(Function);
  });
  it('#append', function() {
    var jsdc = new JSDC();
    expect(jsdc.append).to.be.a(Function);
  });
  it('#prepend', function() {
    var jsdc = new JSDC();
    expect(jsdc.prepend).to.be.a(Function);
  });
  it('#next', function() {
    var jsdc = new JSDC();
    expect(jsdc.next).to.be.a(Function);
  });
  it('static #parse', function() {
    expect(JSDC.parse).to.be.a(Function);
  });
});
describe('ignore es5', function() {
  it('varstmt', function() {
    var s = 'var a = 1';
    var res = JSDC.parse(s);
    expect(res).to.eql(s);
  });
});