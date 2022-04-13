odoo.define('pos_lan_restaurant.screens', function(require) {
    'use strict';

	var models = require('point_of_sale.models');
	var screensPos = require('pos_lan.screens');

	screensPos.LocalOrdersListScreenWidget.include({
		show: function() {
			var self = this;
			this._super();

			if (this.pos.config.iface_floorplan) {
				this.$el.find('[name=btnInvoice]').click(function() {
					$('.js_synch').click();
					var order = self.$el.find('.invoice-list .highlight');
					if (order.length > 0) {
						var currentOrder = self.pos.get_order();
						if (currentOrder) currentOrder.destroy({'reason':'abandon'});

						var jsonData = order.data('data');
						jsonData.sequence_number = self.pos.pos_session.sequence_number++;
						jsonData.uid += jsonData.sequence_number;
						jsonData.name += jsonData.sequence_number;
						self.pos.get('orders').add(new models.Order({},{
							pos: self.pos,
							json: jsonData
						}));
						var orders = self.pos.get_order_list();
						self.pos.set_order(orders[orders.length-1]);

						var table = self.pos.tables_by_id[jsonData.table_id];
						var floorplan = self.getParent();
						floorplan.pos.set_table(table);
					}
				});
			} else {
				this.$el.find('[name=thTable]').addClass('oe_invisible');
			}
		}
	});

});