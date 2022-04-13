odoo.define('pos_gift_card.popups', function (require) {
	"use strict";

	var PopupWidget = require('point_of_sale.popups');
	var gui = require('point_of_sale.gui');
	var rpc = require('web.rpc');
	var core = require('web.core');
	var _t = core._t;

	var VoucherInfoWidget = PopupWidget.extend({
		template: 'VoucherInfoWidget',
		show: function(options){
			options = options || {};
			this._super(options);
			this.renderElement();
			if(options.data){
				var data = options.data;
				this.$('input[name=gift_voucher_ref]').val(data.gift_voucher_ref);
			}
		},
		click_confirm: function(){
			var self = this;
			var infos = {
				'gift_voucher_ref' : this.$('input[name=gift_voucher_ref]').val(),
			};
			var valid = true;
			if(this.options.validate_info){
				valid = this.options.validate_info.call(this, infos);
			}

			rpc.query({
				model: 'pos.gift.card',
				method: 'get_gift_card_info',
				args: [infos.gift_voucher_ref],
				kwargs: {}
			}).then(function(returned_value) {
				if(returned_value.result=='error'){
					self.gui.show_popup('alert', {
						title: _t('Invalid voucher'),
						body: returned_value.message
					});
				}else{
					infos.amount = returned_value.amount;
					self.gui.close_popup();
					if( self.options.confirm ){
						self.options.confirm.call(self, infos);
					}
				}
			});
		},
	});
	gui.define_popup({name:'payment-info-input', widget: VoucherInfoWidget});

	return PopupWidget;
});