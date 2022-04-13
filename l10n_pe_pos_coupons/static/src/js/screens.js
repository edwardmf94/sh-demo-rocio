odoo.define('l10n_pe_pos_coupons.screens', function(require) {
'use strict';

var screens = require('point_of_sale.screens');

screens.ReceiptScreenWidget.include({
	get_receipt_render_env: function() {
		var self = this;
		var result = this._super();
		var receipt_screen_params = this.pos
			.get_order()
			.get_screen_data('params');
		if(receipt_screen_params){
			if(receipt_screen_params.data){
				var oldData = receipt_screen_params.data;
				result.order.get_coupon_id = function(){
					return oldData.coupon_id;
				};
			}
		}
		return result;
	},
});

});