odoo.define('l10n_pe_pos_bonification.screens', function(require) {
'use strict';

var screens = require('point_of_sale.screens');

screens.ProductScreenWidget.include({
    start: function() {
        var self = this;
        this._super();
        $('[name=btnBonif]').click(function(){
            var currentOrder = self.pos.get('selectedOrder');
            var currentOrder = self.pos.get('selectedOrder');
            var selected_orderline = currentOrder.get_selected_orderline();
            if(!selected_orderline){
                self.gui.show_popup('error', {
                    title: 'Linea no seleccionada',
                    body: 'La bonificacion debe aplicarse en una linea.'
                });
            }else{
                self.gui.show_popup('apply_bonification');
            }
        });
        if(!self.pos.config.allow_bonification){
            $('[name=btnBonif]').remove();
        }
    }
});

});