odoo.define('pos_weight.screens', function(require) {
	'use strict';

	var screens = require('point_of_sale.screens');
	var gui = require('point_of_sale.gui');
	var core = require('web.core');
	var rpc = require('web.rpc');

	var QWeb = core.qweb;
	var _t = core._t;

	screens.OrderWidget.include({
		update_summary: function(){
			this._super();
			var order = this.pos.get_order();
			if (!order.get_orderlines().length) {
				return;
			}
			var weight = order.get_total_weight() ? order.get_total_weight() : 0;
			this.el.querySelector('.summary .total .total_weight .value').textContent = weight+"";
		},
	})

});