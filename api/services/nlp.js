/**
 * Created by shengrong on 12/3/15.
 */
var bosonnlp = require('bosonnlp');
var nlp = new bosonnlp.BosonNLP('BbYcOeYf.26180.vRYVmNSmlk7n');

var processor = {
  /*
   */
  receiveContent : function(type, content){
    var _this = this;
    switch (type){
      case 'text':
        nlp.ner(content, _this.classifyWord);
      default:
        break;
    }
  },

  classifyWord : function(results){
    if(!results.length){
      return;
    }
    var result = results[0];
    var words = result['word'];
    var entities = result['entity'];
    var tag = result['tag'];
    //find time, location and products
    var entityObj = {};
    entities.forEach(function(entity){
      sails.log.info('entity ' + entity[2] + ' : ' + words.slice(entity[0],entity[1]));
      entityObj[entity[2]] = words.slice(entity[0],entity[1]);
    })
    if(Object.keys(entityObj).length){
      this.lookingForKeywords(entityObj);
    }else{
      //no keywords has been classified, ask user again.
      sails.log.info('no keywords recognize, ask user again');
    }
  },

  lookingForKeywords : function(keywordsObj){
    var timeKeywords = ['^周五$','^周六$','^周日$','^\d{1,2}(月|.|\/)\d{1,2}(日|号|)$'];
    var locationKeywords = [['^San Francisco$','San Francisco County','^三藩市$'],['^Daly City$','^中湾$','^San Bruno$','^South San Francisco$','^San Mateo County$']
      ,['^南湾$','^Cupertino$','^Sunnyvale$','^MountainView$','^Santa Clara$','^South Bay$'],['^东湾$','^Fremont$','^East Bay$']];
    var countyKeywords = ['San Francisco County','San Mateo County','Santa Clara County','Alameda County'];
    var productKeywords = ['^小龙虾$','^十三香小龙虾$','^麻辣卤水小龙虾$','^麻小$','^蒜泥小龙虾$','^金汤小龙虾$','^辣肉葱油拌面$','^葱油拌面$','^小馄饨$','^千里香小馄饨$','^大馄饨$','^馄饨$','^糟鸡爪$','^小龙虾炒饭$','^酸辣粉$','^重庆酸辣粉$','^小龙虾黄金甲炒饭$','^大骨头汤$']
    if(keywordsObj.hasOwnProperty('time')){
      var times = Object.keys(keywordsObj['time']);
      times.filter(function(time){
        return timeKeywords.some(function(timeKeyword){
          return RegExp(timeKeyword, 'g').test(time);
        })
      });
    }
    if(keywordsObj.hasOwnProperty('location')){
      var locations = Object.keys(keywordsObj['location']);
      var location = '';
      locations.forEach(function(location){
        locationKeywords.forEach(function(locationKeyword, index){
          if(locationKeyword.some(function(keyword){
            return RegExp(keyword,'g').test(location);
            })){
            location = countyKeywords[index];
          }
        })
      });
    }
    if(keywordsObj.hasOwnProperty('product_name')){
      var products = Object.keys(keywordsObj['product_name']);
      products.filter(function(product){
        return productKeywords.some(function(productKeyword){
          return RegExp(productKeyword, 'g').test(product);
        });
      })
    }
    if(times.length){
      sails.log.info('time:' + times[0]);
    }
    if(location){
      sails.log.info('location: ' + location);
    }
    if(products.length){
      sails.log.info('product: ' + products[0]);
    }
  }
}

module.exports = processor;


