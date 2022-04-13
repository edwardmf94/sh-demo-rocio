odoo.define('pos_summary_proxy.screens', function(require) {
'use strict';

var screens = require('pos_summary.screens');
var core = require('web.core');
var Session = require('web.Session');

var QWeb = core.qweb;

screens.SummaryWidget.include({
	print_web: function() {
		var self = this;
		if(!self.pos.config.ihw_proxy){
			window.print();
		}else{
			var receipt = QWeb.render('XmlSummaryReceipt', {
				widget: self,
				pos: self.pos,
				ss: self.data
			});
			var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
			return connection.rpc('/hw_proxy/print_xml_receipt', {
				receipt: receipt
			});
		}
	},
});

});