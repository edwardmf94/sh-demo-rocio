odoo.define('pos_pdf.screens', function(require) {
'use strict';

var screens = require('point_of_sale.screens');
var core = require('web.core');
var rpc = require('web.rpc');

var QWeb = core.qweb;
var _t  = core._t;

screens.ReceiptScreenWidget.include({
	show: function(){
		var self = this;
		this._super();
		var receipt_screen_params = this.pos
			.get_order()
			.get_screen_data('params');
		var showPdf = false;
		if(receipt_screen_params){
			if(receipt_screen_params.data){
				if(self.pos.config.allow_print_pdf && receipt_screen_params.data.account_move){
					showPdf = true;
				}
			}
		}
		this.$('.printa4').unbind('click').click(function(){
			window.open('/report/pdf/account.report_invoice/'+receipt_screen_params.data.account_move);
		});
		if(!showPdf){
			this.$('.printa4').hide();
		}else{
			this.$('.printa4').show();
		}
	},
});

});