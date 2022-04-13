odoo.define('pos_hr_discount.screens', function(require) {
'use strict';

var screens = require('pos_discount.pos_discount');

screens.DiscountButton.include({
    apply_discount: function(pc){
        var self = this;
		if(self.pos.config.pos_hr_discount){
			var isValid = true;
			if(self.pos.get_cashier().pos_level=='cashier'){
				if(parseFloat(pc)>self.pos.company.pos_hr_discount_cashier){
					isValid = false;
				}
			}else if(self.pos.get_cashier().pos_level=='manager'){
				if(parseFloat(pc)>self.pos.company.pos_hr_discount_manager){
					isValid = false;
				}
			}else if(self.pos.get_cashier().pos_level=='admin'){
				if(parseFloat(pc)>self.pos.company.pos_hr_discount_admin){
					isValid = false;
				}
			}
			if(isValid){
				this._super.apply(this, arguments);
			}else{
				alert('Se ha excedido el máximo permitido de descuento.');
			}
		}else{
			this._super.apply(this, arguments);
        }
    },
});

});