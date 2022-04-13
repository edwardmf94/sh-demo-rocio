odoo.define('pos_payment_ref.popups', function (require) {
"use strict";

var PopupWidget = require('point_of_sale.popups');
var gui = require('point_of_sale.gui');

var PaymentInfoWidget = PopupWidget.extend({
    template: 'PaymentInfoWidget',
    show: function(options){
        options = options || {};
        this._super(options);
        this.renderElement();
        if(options.data){
            var data = options.data;
            this.$('input[name=payment_ref]').val(data.payment_ref);
        }
    },
    click_confirm: function(){
        var infos = {
            'payment_ref' : this.$('input[name=payment_ref]').val(),
        };
        var valid = true;
        if(this.options.validate_info){
            valid = this.options.validate_info.call(this, infos);
        }

        this.gui.close_popup();
        if( this.options.confirm ){
            this.options.confirm.call(this, infos);
        }
    },
});
gui.define_popup({name:'payment-info-input', widget: PaymentInfoWidget});

return PopupWidget;
});