odoo.define('l10n_pe_pos_bonification.popups', function(require) {
    'use strict';

    var gui = require('point_of_sale.gui');
    var PopupWidget = require('point_of_sale.popups');

    var BonificationPopup = PopupWidget.extend({
        template: 'SelectionPopupWidget',
        show: function(options) {
            var self = this;
            options = options || {};
            this._super(options);

            this.title = 'Aplicar bonificación';
            this.list = self.pos.taxes_bonification.map(it => {
                return {
                    ...it,
                    label: it.name
                };
            });
            this.is_selected =
                options.is_selected ||
                function(item) {
                    return false;
                };
            this.renderElement();
        },
        click_item: function(event) {
            var self = this;
            var currentOrder = self.pos.get('selectedOrder');
            var selected_orderline = currentOrder.get_selected_orderline();
            this.gui.close_popup();
            var item = this.list[parseInt($(event.target).data('item-index'))];
            selected_orderline.set_tax_bonification(item);
        }
    });
    gui.define_popup({ name: 'apply_bonification', widget: BonificationPopup });

});