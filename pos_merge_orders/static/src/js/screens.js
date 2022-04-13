odoo.define('pos_merge_orders.screens', function(require) {
	'use strict';

	var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');
	var core = require('web.core');
	var QWeb = core.qweb;
	var _t = core._t;

	screens.ProductScreenWidget.include({
		start: function() {
			var self = this;
			this._super();
			this.$('[name=btnMerge]').click(function() {
				var currentOrder = self.pos.get_order();
				var selection_list = self.pos.get_order_list().map(function(item){
					return {
						label: `${item.sequence_number} - ${item.attributes.client.name}`,
						item: item.cid
					}
				}).filter(function(item){
					return currentOrder.cid!=item.item;
				});
				self.gui.show_popup('selection',{
					title: _t('Combine order'),
					list: selection_list,
					confirm: function (cid) {
						var order = self.pos.get_order();
						self.pos.get_order_list().forEach(function(item){
							if(item.cid==cid){
								var lines = item.get_orderlines();
								for(var i=0; i<lines.length; i++){
									var orderline = lines[i];
									var lineJson = orderline.export_as_JSON();
									var product = self.pos.db.get_product_by_id(lineJson.product_id);
									order.add_product(product, {
										price: lineJson.price_unit,
										uom_id: lineJson.uom_id,
										quantity: lineJson.qty,
										discount: lineJson.discount,
										merge: false
									});
									var selected_orderline = order.get_selected_orderline();
									selected_orderline.price_manually_set = true;
									if(selected_orderline.set_uom!==undefined){
										selected_orderline.set_uom({0:self.pos.units_by_id[lineJson.uom_id].id, 1:self.pos.units_by_id[lineJson.uom_id].name});
									}
								}
								item.destroy({'reason':'abandon'});
							}
						});
						order.trigger('change');
					}
				});
			});
		}
	});
});