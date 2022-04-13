odoo.define('l10n_pe_pos_coupons.models', function (require) {
"use strict";

var models = require('point_of_sale.models');

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
	add_coupon_product: function(product, quantity){
		var self = this;
		self.add_product(product, {quantity: quantity, merge: false});
		var selected_orderline = self.get_last_orderline();
		selected_orderline.set_tax_bonification(self.pos.taxes_bonification[0]);
	},
	remove_coupon_product: function(product_id){
		var self = this;
		var lines = self.get_orderlines();
		for (var i = 0; i < lines.length; i++) {
			if (lines[i].get_product().id === product_id && lines[i].get_tax_bonification()) {
				self.remove_orderline(lines[i]);
			}
		}
	},
});

});