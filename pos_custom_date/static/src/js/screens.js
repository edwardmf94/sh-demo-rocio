odoo.define('pos_custom_date.screens', function(require) {
	'use strict';

	var screens = require('point_of_sale.screens');

	screens.ProductScreenWidget.include({
		start: function() {
			var self = this;
			this._super();
			$('[name=btnOutDate]').click(function(){
				var currentOrder = self.pos.get('selectedOrder');
				self.gui.show_popup('forced-date-info-input', {data: {forced_date: currentOrder.forced_date}});
			});
			if(!self.pos.config.allow_outdate) {
				$('[name=btnOutDate]').remove();
			}else{
				$('[name=btnOutDate]').show();
			}
		},

	});

});
