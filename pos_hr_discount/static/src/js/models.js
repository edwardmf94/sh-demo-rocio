odoo.define('pos_hr_discount.models', function(require) {
'use strict';

var models = require('point_of_sale.models');

models.load_fields('hr.employee', ['pos_level']);
models.load_fields('res.company', ['pos_hr_discount_cashier','pos_hr_discount_manager','pos_hr_discount_admin']);

var _super_orderline = models.Orderline.prototype;
models.Orderline = models.Orderline.extend({
	set_discount: function(discount){
		var self = this;
		if(self.pos.config.pos_hr_discount){
			var isValid = true;
			if(self.pos.get_cashier().pos_level=='cashier'){
				if(parseFloat(discount)>self.pos.company.pos_hr_discount_cashier){
					isValid = false;
				}
			}else if(self.pos.get_cashier().pos_level=='manager'){
				if(parseFloat(discount)>self.pos.company.pos_hr_discount_manager){
					isValid = false;
				}
			}else if(self.pos.get_cashier().pos_level=='admin'){
				if(parseFloat(discount)>self.pos.company.pos_hr_discount_admin){
					isValid = false;
				}
			}
			if(isValid){
				_super_orderline.set_discount.apply(this, arguments);
			}else{
				alert('Se ha excedido el máximo permitido de descuento.');
			}
		}else{
			_super_orderline.set_discount.apply(this, arguments);
		}
	}
});

});