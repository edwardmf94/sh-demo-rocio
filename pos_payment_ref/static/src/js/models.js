odoo.define('pos_payment_ref.models', function (require) {
"use strict";

var models = require('point_of_sale.models');

models.load_fields("pos.payment.method", "pos_payment_ref");


var paymentline_super = models.Paymentline.prototype;
models.Paymentline = models.Paymentline.extend({
    init_from_JSON: function (json) {
        paymentline_super.init_from_JSON.apply(this, arguments);
        this.payment_ref = json.payment_ref;
    },
    export_as_JSON: function () {
        return _.extend(paymentline_super.export_as_JSON.apply(this, arguments), {
            payment_ref: this.payment_ref,
        });
    },
});

var order_super = models.Order.prototype;
models.Order = models.Order.extend({
    add_paymentline_with_details: function(payment_method, infos) {
        this.assert_editable();
        var newPaymentline = new models.Paymentline({},{order: this, payment_method:payment_method, pos: this.pos});
        $.extend(newPaymentline, infos);
        if(!payment_method.is_cash_count || this.pos.config.iface_precompute_cash){
            newPaymentline.set_amount( this.get_due() );
        };
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