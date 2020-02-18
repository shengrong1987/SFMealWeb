/**
 * Combo.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    dishes: {
      collection: 'dish'
    },
    chefs: {
      collection: 'host'
    },
    discount: {
      type: 'float'
    },
    title: {
      type: 'string'
    },
    pickupOptions: {
      collection: 'pickupOption'
    }
  }
};

