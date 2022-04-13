odoo.define('pos_coupons.screens', function(require) {
'use strict';

var screens = require('point_of_sale.screens');
var core = require('web.core');
var rpc = require('web.rpc');

var QWeb = core.qweb;
var _t  = core._t;

screens.ProductScreenWidget.include({
	start: function() {
		var self = this;
		this._super();
		$('[name=btnCoupon]').click(function(){
			self.gui.show_popup('apply_coupon');
		});
		if(!self.pos.config.allow_read_coupons){
			$('[name=btnCoupon]').remove();
		}
	}
});

screens.PaymentScreenWidget.include({
	validate_order: function(force_validation){
		var self = this;
		if (this.order_is_valid(force_validation)) {
			if(self.pos.config.allow_create_coupons){
				var validCoupons = self.check_create_coupon();
				if(validCoupons.length>0){
					var order = self.pos.get_order();
					order.set_coupon_program(validCoupons);
				}
			}
		}
		this._super();
	},
	check_create_coupon: function(){
		var self = this;
		var coupon_programs = self.pos.coupon_programs;
		var coupons = [];
		var order = self.pos.get_order();
		var lines = order.get_orderlines();
		coupon_programs.forEach(function(program,indexProgram){
			if(program.product_ids){
				var isValid = false;
				lines.forEach(function(line){
					if(program.product_ids.includes(line.product.id)){
						isValid = true;
					}
				});
				if(isValid){
					var program_title = program.discount_percentage+_t(' DISCOUNT ON YOUR NEXT PURCHASE');
					if(program.reward_type=='discount'){
						program_title = _t('FREE ')+program.reward_product_id[1]+_t(' ON YOUR NEXT PURCHASE');
					}
					var coupon_data = {
						program_id: program.id,
						program_name: program.name,
						coupon_uid: self.generate_uid_coupon(order.sequence_number,indexProgram),
						title: program_title,
						due_date: moment().add(program.validity_duration,'days').format('DD/MM/YYYY'),
						minimun: program.rule_minimum_amount
					};
					if(program.reward_type=='discount'){
						coupon_data.percentage = program.discount_percentage;
					}else{
						coupon_data.product = {
							id: program.reward_product_id[0],
							name: program.reward_product_id[1]
						};
					}
					coupons.push(coupon_data);
				}
			}
		});
		return coupons;
	},
	generate_uid_coupon: function(sequence,index){
		var self = this;
		function zero_pad(num,size){
			var s = ""+num;
			while (s.length < size) {
				s = "0" + s;
			}
			return s;
		}
		return zero_pad(self.pos.pos_session.id,6) +
			zero_pad(self.pos.pos_session.login_number,5) +
			zero_pad(sequence,5)+
			zero_pad(index,4);
	}
});

});