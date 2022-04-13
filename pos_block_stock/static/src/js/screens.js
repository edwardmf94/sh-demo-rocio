odoo.define('pos_block_stock.screens', function(require) {
'use strict';

var screens = require('point_of_sale.screens');

screens.ProductListWidget.include({
	renderElement: function(){
		var self = this;
		this._super.apply(this, arguments);
		for(var i = 0, len = this.product_list.length; i < len; i++){
			if(this.product_list[i].pos_blocked_wh_ids){
				if(this.product_list[i].pos_blocked_wh_ids.length>0){
					var founded = this.product_list[i].pos_blocked_wh_ids.includes(self.pos.pos_location.id);
					if(founded){
						$('.product-screen .product-list article[data-product-id='+this.product_list[i].id+']').addClass('disable');
						$('.product-screen .product-list tr[data-product-id='+this.product_list[i].id+']').addClass('disable');
					}
				}
			}
		}
	}
});

});