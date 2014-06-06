var expect = require('expect.js');
var JSDC = require('../');

describe('api', function() {
  it('#parse', function() {
    var jsdc = new JSDC();
    expect(jsdc.parse).to.be.a(Function);
  });
  it('static #parse', function() {
    expect(JSDC.parse).to.be.a(Function);
  });
});