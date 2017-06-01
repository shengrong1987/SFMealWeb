var expect = chai.expect;

+function ($) {
  'use strict';
  describe("Pagination", function(){
    var element = document.createElement("div");
    describe("constructor", function(){
      it("should have default values", function(){
        var pagination = $(element).pagination({}, $(element)).data("bs.pagination");
        expect(pagination.$options.npp).to.equal(5);
        expect(pagination.$options.index).to.equal(1);
      })
    })
  })
}(jQuery);

