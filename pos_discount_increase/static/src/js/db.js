odoo.define('pos_discount_increase.db', function(require) {
    'use strict';

	var DB = require('point_of_sale.DB');

	DB.include({
		init: function(options){
			var self = this;
			this._super();
			this.pos_increase_by_id = {};
			this.pos_increase = [];
			this.pos_discount_by_id = {};
			this.pos_discount = [];
		},
		add_pos_increase: function(pos_increases){
			this.pos_increase = pos_increases;
			var updated_count = 0;
			var pos_increase;
			for(var i = 0, len = pos_increases.length; i < len; i++){
				pos_increase = pos_increases[i];
				this.pos_increase_by_id[pos_increase.id] = pos_increase;
				updated_count += 1;
			}
			return updated_count;
		},
		add_pos_discount: function(discounts){
			this.pos_discount = discounts;
			var updated_count = 0;
			var pos_discount;
			for(var i = 0, len = discounts.length; i < len; i++){
				pos_discount = discounts[i];
				this.pos_discount_by_id[pos_discount.id] = pos_discount;
				updated_count += 1;
			}
			return updated_count;
		},
	});

});