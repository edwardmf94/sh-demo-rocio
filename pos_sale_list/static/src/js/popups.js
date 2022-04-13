odoo.define('pos_sale_list.popups', function(require) {
	'use strict';
	var gui = require('point_of_sale.gui');
	var PopupWidget = require('point_of_sale.popups');
	var Screens = require('point_of_sale.screens');
	var core = require('web.core');
	var rpc = require('web.rpc');

	var QWeb = core.qweb;
	var _t = core._t;

	var SaveSaleOrderWidget = PopupWidget.extend({
		template: 'SaveSaleOrderWidget',
		events: {
			'click .button_close': 'clickHide'
		},
		clickHide: function() {
			this.pos.gui.close_popup();
		},
		show: function(options) {
			var self = this;
			options = options || {};
			this._super(options);
			self.$el.find('[name=date_order]').datepicker({
				dateFormat:'yy-mm-dd',
				onSelect: function(dateText) {
					self.$el.find('.ex_content').html('<span>'+_t('Loading...')+'</span>');
					self.saveSaleOrder(dateText);
				}
			});
		},
		saveSaleOrder: function(selectedDate){
			var self = this;
			var currentOrder = self.pos.get_order();
			selectedDate = moment(selectedDate, 'YYYY-MM-DD')
					.add(5, 'hours')
					.format('YYYY-MM-DD HH:mm');
			if (!currentOrder.get_client()){
				self.pos.gui.close_popup();
				self.gui.show_popup('alert', {
					title: _t('REQUIRED INFORMATION'),
					body: _t('You must select a customer to continue')
				});
				return
			}
			currentOrder.set_seller_id(this.pos.get_cashier().id)
			var data = {
				partner_id: currentOrder.get_client().id,
				employee_id: currentOrder.get_seller_id(),
				user_id: this.pos.pos_session.user_id[0],
				requested_date: selectedDate,
				order_line: currentOrder.orderlines.map(function(line){
					var product = line.get_product();
					var taxes = [[6, false, _.map(line.get_applicable_taxes(), function(tax){ return tax.id; })]]
					var unit_price = line.get_unit_price();
					return [0,0,{
						product_id: product.id,
						product_uom_qty: line.get_quantity(),
						price_unit: unit_price,
						tax_id: taxes
					}];
				})
			}
			rpc.query({
				model: 'sale.order',
				method: 'create_from_ui',
				args: [data]
			})
			.then(function(returned_value) {
				self.pos.gui.close_popup();
				currentOrder.destroy();
				returned_value._date = moment().format('DD/MM/YYYY HH:mm');
				self.gui.show_screen('sale_print',{order: returned_value});
			});
		}
	});

	gui.define_popup({ name: 'save_sale_order', widget: SaveSaleOrderWidget });
});