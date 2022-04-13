odoo.define('pos_coupons.popups', function(require) {
'use strict';

var gui = require('point_of_sale.gui');
var PopupWidget = require('point_of_sale.popups');
var rpc = require('web.rpc');
var _t  = require('web.core')._t;

var CouponPopup = PopupWidget.extend({
	template: 'CouponPopupWidget',
	program: false,
	coupon_id: false,
	events: {
		'click .button_check': 'clickCheck',
		'click .button_apply': 'clickApply',
		'click .button_close': 'clickHide'
	},
	show: function(options) {
		var self = this;
		options = options || {};
		this._super(options);
		self.$el.find('[name=coupon_code]').keypress(function(e) {
			if(e.which == 13) {
				self.clickCheck();
			}
		});
	},
	clickHide: function() {
		this.pos.gui.close_popup();
	},
	clickCheck: function(event) {
		var self = this;
		var code = self.$el.find('[name=coupon_code]').val();
		rpc.query({
			model: 'sale.coupon',
			method: 'pos_check_validity',
			args: [code],
		}).then(function (response) {
			if(response.validity){
				var coupon_programs = self.pos.coupon_programs;
				var prizeStr = '';
				var program = coupon_programs.find(function(item){
					return item.id == response.program_id;
				});
				if(program.reward_type=='discount'){
					prizeStr = '<strong>descuento de '+program.discount_percentage+'</strong>';
				}else{
					prizeStr = '<strong>'+program.reward_product_id[1]+' de regalo</strong>';
				}
				self.$el.find('.coupon-msg').html(_t('Valid coupon! It will allow to get ')+prizeStr);
				self.program = program;
				self.coupon_id = response.coupon_id;
			}else{
				self.gui.close_popup();
				self.gui.show_popup('error', {
					title: _t('Consume error'),
					body: response.message
				});
			}
		});
	},
	clickApply: function(){
		var self = this;
		if(!self.program){
			return self.gui.show_popup('error', {
				title: _t('Invalid Coupon'),
				body: _t('Debe ingresar un cupón válido!')
			});
		}
		var order = self.pos.get_order();
		if(order.get_coupon_id()){
			if(confirm(_t('There is a coupon already applied. Want to replace it?'))){
				order.remove_coupon();
				return alert(_t('Deleted coupon. Click again to apply new coupon.'));
			}else{
				return self.gui.show_popup('error', {
					title: _t('Cupon inválido'),
					body: _t('You need to enter a valid coupon!')
				});
			}
		}
		var code = self.$el.find('[name=coupon_code]').val();
		order.apply_coupon(self.program, self.coupon_id, code);
		self.gui.close_popup();
	}
});
gui.define_popup({ name: 'apply_coupon', widget: CouponPopup });

return CouponPopup;
});