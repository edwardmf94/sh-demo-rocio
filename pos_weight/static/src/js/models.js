odoo.define('pos_weight.models', function (require) {
	"use strict";

	var models = require('point_of_sale.models');
	var utils = require('web.utils');
	var round_di = utils.round_decimals;

	models.load_fields('product.product', ['weight'])

	var _super_orderline = models.Orderline.prototype;
	models.Orderline = models.Orderline.extend({
		init_from_JSON: function (json) {
			_super_orderline.init_from_JSON.apply(this, arguments);
			this.total_weight = json.total_weight || 0;
		},
		export_as_JSON: function() {
			var json = _super_orderline.export_as_JSON.apply(this, arguments);
			json.total_weight = this.get_total_weight();
			return json;
		},
		export_for_printing: function(){
			var json = _super_orderline.export_for_printing.apply(this, arguments);
			json.total_weight = this.get_total_weight();
			return json;
		},
		set_total_weight: function(){
			var self = this;
			let totalWeight = 0;
			let product = this.get_product();
			if (product.weight) {
				totalWeight += product.weight * self.get_quantity();
				totalWeight = round_di(parseFloat(totalWeight) || 0, self.pos.currency.decimals);
			}
			self.total_weight = totalWeight;
		},
		get_total_weight: function(){
			this.set_total_weight();
			return this.total_weight;
		},
	});

	var _super_order = models.Order.prototype;
	models.Order = models.Order.extend({
		init_from_JSON: function (json) {
			_super_order.init_from_JSON.apply(this, arguments);
			this.total_weight = json.total_weight || 0;
			this.save_to_db();
		},
		export_as_JSON: function() {
			var json = _super_order.export_as_JSON.apply(this, arguments);
			json.total_weight = this.get_total_weight();
			return json;
		},
		set_total_weight: function() {
			let totalWeight = 0;
			var order = this.pos.get_order();
			var self = this;
			if(order){
				order.orderlines.forEach(function(item) {
					let product = item.get_product();
					if (product.weight) {
						totalWeight += product.weight * item.get_quantity();
						totalWeight = round_di(parseFloat(totalWeight) || 0, self.pos.currency.decimals);
					}
				});
				self.total_weight = Math.round(totalWeight*1000)/1000;
			}
		},
		get_total_weight: function(){
			this.set_total_weight();
			return this.total_weight;
		},
	});

});