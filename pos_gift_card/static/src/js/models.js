odoo.define('pos_gift_card.models', function (require) {
	"use strict";

	var models = require('point_of_sale.models');
	var utils = require('web.utils');
	var round_di = utils.round_decimals;
	var round_pr = utils.round_precision;

	models.load_fields("pos.payment.method", "gift_voucher");


	var paymentline_super = models.Paymentline.prototype;
	models.Paymentline = models.Paymentline.extend({
		init_from_JSON: function (json) {
			paymentline_super.init_from_JSON.apply(this, arguments);

			this.gift_voucher_ref = json.gift_voucher_ref;
		},
		export_as_JSON: function () {
			return _.extend(paymentline_super.export_as_JSON.apply(this, arguments), {
				gift_voucher_ref: this.gift_voucher_ref,
			});
		},
		//sets the amount of money on this payment line
		set_amount: function(value){
			if(this.payment_method.gift_voucher){
				return false;
			}
			this.order.assert_editable();
			this.amount = round_di(parseFloat(value) || 0, this.pos.currency.decimals);
			this.pos.send_current_order_to_customer_facing_display();
			this.trigger('change',this);
		},
		//sets the amount of money on this payment line
		set_amount_gift: function(value){
			this.order.assert_editable();
			this.amount = round_di(parseFloat(value) || 0, this.pos.currency.decimals);
			this.trigger('change',this);
		},
	});

	var order_super = models.Order.prototype;
	models.Order = models.Order.extend({
		add_paymentline_with_details: function(payment_method, infos) {
			this.assert_editable();
			var newPaymentline = new models.Paymentline({},{order: this, payment_method:payment_method, pos: this.pos});
			if(!payment_method.is_cash_count || this.pos.config.iface_precompute_cash){
				newPaymentline.set_amount( this.get_due() );
			};
			if(payment_method.gift_voucher){
				$.extend(newPaymentline, infos);
				newPaymentline.set_amount_gift( infos.amount );
			}
			this.paymentlines.add(newPaymentline);
			this.select_paymentline(newPaymentline);
		},
		update_paymentline_with_details: function(paymentline, infos) {
			this.assert_editable();
			$.extend(paymentline, infos);
			this.select_paymentline(paymentline);
		},
	});

	return models;
});