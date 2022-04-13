odoo.define('pos_discount_increase.models', function(require) {
    'use strict';

    var models = require('point_of_sale.models');

    models.load_models({
        model: 'pos.increase',
        fields: ['id', 'code', 'name', 'percent'],
        domain: function(self) {
            return [['active', '=', true]];
        },
        loaded: function(self, items) {
            self.db.add_pos_increase(items);
        }
    });

    models.load_models({
        model: 'pos.discount',
        fields: ['id', 'code', 'name', 'percent'],
        domain: function(self) {
            return [['active', '=', true]];
        },
        loaded: function(self, items) {
            self.db.add_pos_discount(items);
        }
    });

    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        set_increase: function(discount){
            this.discount = -discount;
            this.discountStr = '-' + discount;
            this.trigger('change',this);
        },
        export_as_JSON: function() {
            var json = _super_orderline.export_as_JSON.apply(this, arguments);
            if(this.order.get_global_increase()){
                json.price_unit = this.get_price_with_tax() / this.get_quantity();
                json.discount = 0;
            }
            return json;
        },
        export_for_printing: function() {
            var json = _super_orderline.export_for_printing.apply(this, arguments);
            if(this.order.get_global_increase()){
                json.price = this.get_unit_display_price() * (1-(this.discount/100));
                json.discount = 0;
            }
            return json;
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function () {
            _super_order.initialize.apply(this, arguments);
            this.global_discount = this.global_discount || false;
            this.global_increase = this.global_increase || false;
            this.save_to_db();
        },
        export_as_JSON: function () {
            var json = _super_order.export_as_JSON.apply(this, arguments);
            json.global_discount_id = this.get_global_discount() ? this.get_global_discount().id : false;
            json.global_increase_id = this.get_global_increase() ? this.get_global_increase().id : false;
            return json;
        },
        set_global_discount: function (global_discount) {
            var self = this;
            this.assert_editable();
            this.global_discount = global_discount;
            self.orderlines.forEach(function (line) {
                var validApply = false;
                if (line.get_product().hasOwnProperty('pos_discount')) {
                    validApply = line.get_product().pos_discount;
                } else {
                    validApply = true;
                }
                if (validApply) {
                    if (global_discount) line.set_discount(global_discount.percent);
                    else line.set_discount(0);
                }
            });
            this.save_to_db();
        },
        get_global_discount: function () {
            return this.global_discount;
        },
        set_global_increase: function(global_increase) {
            var self = this;
            this.assert_editable();
            this.global_increase = global_increase;
            self.orderlines.forEach(function(line){
                if(global_increase) line.set_increase(global_increase.percent);
                else line.set_increase(0);
            });
            this.save_to_db();
        },
        get_global_increase: function() {
            return this.global_increase;
        },
    });
})