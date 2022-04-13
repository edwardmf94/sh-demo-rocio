odoo.define('l10n_pe_pos_bonification.models', function (require) {
"use strict";

var models = require('point_of_sale.models');

var existing_models = models.PosModel.prototype.models;
var atax_index = _.findIndex(existing_models, function (model) {
    return model.model === "account.tax";
});
var acctax_model = existing_models[atax_index];

models.load_models([{
    model:  acctax_model.model,
    fields: acctax_model.fields,
    order:  acctax_model.order,
    domain: function (self) {
        var domain = acctax_model.domain(self);
        domain.push(['type_tax_use','=','sale']);
        return domain;
    },
    context: acctax_model.context,
    loaded: function (self, taxes) {
            var b_taxes = [];
            var done = $.Deferred();
            acctax_model.loaded(self, taxes);
            var taxes = self.taxes;
            for (var s = 0; s < taxes.length; s++) {
                if (taxes[s].l10n_pe_edi_tax_code == '9996'){
                    b_taxes.push(taxes[s])
                }
            }
            done.resolve();
            self.taxes_bonification = b_taxes
            return done;
        }
}]);


var _super_orderline = models.Orderline.prototype;
models.Orderline = models.Orderline.extend({
    initialize: function (attr, options) {
        _super_orderline.initialize.apply(this, arguments);
        this.tax_bonification = false;
        this.tax_bonification_id = false;
    },
    init_from_JSON: function(json) {
        var self = this;
        _super_orderline.init_from_JSON.apply(this, arguments);
        if(json.tax_bonification){
            self.set_tax_bonification(json.tax_bonification);
        }
    },
    export_as_JSON: function() {
        var json = _super_orderline.export_as_JSON.apply(this, arguments);
        json.tax_bonification_id = this.get_tax_bonification_id() ? this.get_tax_bonification_id() : false;
        return json;
    },
    set_tax_bonification: function (bonification) {
        this.order.assert_editable();
        var self = this;
        if (bonification){
            self.tax_bonification = bonification;
            self.set_tax_bonification_id(bonification.id);
            if(self.pos.company.pos_hr_discount_cashier!=undefined){
                var disc = Math.min(Math.max(parseFloat(100) || 0, 0),100);
                self.discount = disc;
                self.discountStr = '' + disc;
                self.trigger('change',self);
            }else{
                self.set_discount(100);
            }
        }
    },
    get_tax_bonification: function () {
        return this.tax_bonification;
    },
    set_tax_bonification_id: function (bid) {
        this.order.assert_editable();
        this.tax_bonification_id = bid;
    },
    get_tax_bonification_id: function () {
        return this.tax_bonification_id;
    },
});

});