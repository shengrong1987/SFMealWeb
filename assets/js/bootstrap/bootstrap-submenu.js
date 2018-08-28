/**
 * $.inArray: friends with IE8. Use Array.prototype.indexOf in future.
 * $.proxy: friends with IE8. Use Function.prototype.bind in future.
 */

'use strict';

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module
    define(['jquery'], factory);
  }
  else if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  }
  else {
    // Browser globals
    factory(jQuery);
  }
})(function($) {

  function Submenupicker(element) {
    this.$element = $(element);
    this.$main = this.$element.parent();
    this.$menu = this.$main.children('.dropdown-menu');
    this.$items = this.$menu.children('.dropdown-submenu');
    this.init();
  }

  Submenupicker.prototype = {
    init: function() {
      this.$menu.find("a.dropdown-toggle").off('click');
      this.$menu.find("a.dropdown-toggle").on('click', function(e){
        if (!$(this).next().hasClass('show')) {
          $(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
        }
        var $subMenu = $(this).next(".dropdown-menu");
        $subMenu.toggleClass('show');

        $(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function(e) {
          $('.dropdown-submenu .show').removeClass("show");
        });
        return false;
      })
    },
    insertMenu : function(layer, value, wait){
      var parentMenu = this.findParentSubmenu(layer);
      var children = this.tract(parentMenu, layer);
      this.insert(parentMenu, value, children, layer);
      setupDropdownMenu();
      if(!wait){
        this.init();
      }
    },
    removeMenu : function(layer, value){
      var parentMenu = this.findParentSubmenu(layer);
      this.remove(parentMenu, layer);
    },
    updateMenu : function(layer, value){
      // var numberOnly = value.match(/\d+/) ? value.match(/\d+/)[0] : 0;
      for(var i=2; i <= value; i++){
        this.insertMenu(layer, i, true);
      }
      setupDropdownMenu();
      this.init();
    },
    findParentSubmenu : function(layer){
      if(layer===0){ return this.$menu };
      var parentMenu =  this.$menu.find("[data-layer='" +  layer + "']").parent();
      return parentMenu;
    },
    tract : function(parent, layer){
      var ele = parent.find("[data-layer='" +  layer + "'] .dropdown-menu:first").children();
      return ele.clone();
    },
    insert : function(parent,value,children,layer){
      var newSubmenu = '<div class="dropdown dropdown-submenu" data-layer="' + layer + '">' +
        '<a class="dropdown-item dropdown-toggle" tabindex="0" data-toggle="dropdown" data-select="true">' +
        '<span data-toggle="i18n" data-key="orderNo" data-param=' + value + '>' + value + '</span>' +
        '</a>' +
        '<div class="dropdown-menu"></div>' +
        '</div>';

      parent.append(newSubmenu);
      parent.children().last().find(".dropdown-menu").append(children);
    },
    remove : function(parent, layer){
      parent.find(".dropdown-submenu[data-layer='" + layer + "']").last().remove();
    }
  };

  var old = $.fn.submenupicker;

  // For AMD/Node/CommonJS used elements (optional)
  // http://learn.jquery.com/jquery-ui/environments/amd/
  $.fn.submenupicker = function(option, elements) {
    var $elements = this instanceof $ ? this : $(elements);

    return $elements.each(function() {
      var data = $.data(this, 'bs.submenu');

      if (!data) {
        data = new Submenupicker(this);

        $.data(this, 'bs.submenu', data);
      }
      if(typeof option === "string"){ data[option]($elements.data('layer'),$elements.data("value"))};
    });
  };

  $.fn.submenupicker.Constructor = Submenupicker;
  $.fn.submenupicker.noConflict = function() {
    $.fn.submenupicker = old;
    return this;
  };

  return $.fn.submenupicker;
});
