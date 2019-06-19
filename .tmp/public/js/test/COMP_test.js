var expect = chai.expect;

+function ($) {
  'use strict';
  describe("Pagination", function(){
    var lessPage;
    it("should have default values", function(){
      var element = $("[data-trigger='pagination']")[0];
      lessPage = $(element).data("bs.pagination")
      expect(lessPage.$options.npp).to.equal(5);
      expect(lessPage.$options.index).to.equal(1);
    })

    it("should not have page number if items are smaller than npp", function(){
      expect(lessPage.$pages).to.be.undefined;
    })

    it("should not have error if target not exist", function(){
      var element = $("[data-trigger='pagination']")[1];
      var pagination = $(element).data('bs.pagination');
      expect(pagination).to.exist;
    })

    it("should have correct page number if item can be divided by npp", function(){
      var element = $("[data-trigger='pagination']")[2];
      var pagination = $(element).data("bs.pagination");
      expect(pagination.$pages).to.equal(2);
    })

    it("should have correct page number if item can not be divided by npp", function(){
      var element = $("[data-trigger='pagination']")[3]
      var pagination = $(element).data("bs.pagination");
      expect(pagination.$pages).to.equal(3);
    })

    it("should render page item correctly", function(){
      var element = $("[data-trigger='pagination']")[3]
      var pagesElement = $(element).find("li");
      expect(pagesElement.length).to.equal(3);
    })

    it("should render content item correctly", function(){
      var element = $("[data-trigger='pagination']")[3];
      var pagination = $(element).data("bs.pagination");
      var contentElement = $(pagination.$options.target);
      expect(contentElement.find(".item:nth-child(1)").css("display")).to.be.equal("inline");
      expect(contentElement.find(".item[style*='inline']").length).to.be.equal(5);
    })

    it("should select the first page by default", function(){
      var element = $("[data-trigger='pagination']")[3]
      var pagesElement = $(element).find("li");
      expect($(pagesElement[0]).hasClass('active')).to.be.true;
    })

    it("should select different page index", function(){
      var element = $("[data-trigger='pagination']")[3];
      var li = $(element).find("li")[2];
      var pagination = $(element).data('bs.pagination');
      $(li).pagination('change', $(element));
      var pagesElement = $(element).find("li");
      expect(pagination.$curPage).to.be.equal(3);
      expect($(pagesElement[2]).hasClass('active')).to.be.true;
    })

    it("should render content item correctly", function(){
      var element = $("[data-trigger='pagination']")[3];
      var pagination = $(element).data("bs.pagination");
      var contentElement = $(pagination.$options.target);
      expect(contentElement.find(".item:nth-child(11)").css("display")).to.be.equal("inline");
      expect(contentElement.find(".item[style*='inline']").length).to.be.equal(2);
    })

  })
}(jQuery);

