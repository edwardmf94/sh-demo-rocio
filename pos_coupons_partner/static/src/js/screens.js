odoo.define('pos_coupons_partner.screens', function(require) {
'use strict';

var screens = require('point_of_sale.screens');
var core = require('web.core');
var rpc = require('web.rpc');

var QWeb = core.qweb;
var _t  = core._t;

screens.PaymentScreenWidget.include({
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
				if(program.partner_ids!==undefined){
					if(program.partner_ids.length>0&&order.get_client()){
						if(isValid && program.partner_ids.includes(order.get_client().id)){
							isValid = true;
						}else{
							isValid = false;
						}
					}else{
						if(order.get_client()==null){
							isValid = false;
						}
					}
				}
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
	}
});

});