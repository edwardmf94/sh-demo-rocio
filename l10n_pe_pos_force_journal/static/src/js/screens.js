odoo.define('l10n_pe_pos_force_journal.screens', function (require) {
"use strict";

var core = require('web.core');
var screens = require('point_of_sale.screens');
var screensPePos = require('l10n_pe_pos.screens');
var rpc = require('web.rpc');

var _t = core._t;

var PaymentScreenWidget = screens.PaymentScreenWidget;
PaymentScreenWidget.include({
	pe_validation: function(){
		var self = this;
		var result = this._super();
		var order = self.pos.get_order();
		if(self.pos.config.force_journal){
			if(result && order.is_to_invoice()){
				return true;
			}else{
				self.gui.show_popup('error',{
					title: 'Diario obligatorio',
					body:  'Debe seleccionar un diario para continuar'
				});
				return false;
			}
		}else{
			return result;
		}
	},
});

});