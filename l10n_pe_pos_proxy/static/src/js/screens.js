odoo.define('l10n_pe_pos_proxy.screens', function(require) {
'use strict';

var screens = require('point_of_sale.screens');
var core = require('web.core');
var Session = require('web.Session');

var QWeb = core.qweb;


var PaymentScreenWidget = screens.PaymentScreenWidget;
PaymentScreenWidget.include({
	save_order_sync_proxy: function(order){
		var self = this;
		return new Promise(function(resolve,reject){
			self.pos.proxy.save_order_proxy({'data':order.export_as_JSON()}).then(function(result){
				resolve(result);
			}).catch(function(err){
				reject(err);
			});
		});
	},
	finalize_validation: function() {
		var self = this;
		var order = this.pos.get_order();

		if(this.pos.config.allow_proxy_control_sequences){
			if ((order.is_paid_with_cash() || order.get_change()) && this.pos.config.iface_cashdrawer) { 
					this.pos.proxy.printer.open_cashbox();
			}
			if (order.is_to_invoice()) {
				self.save_order_sync_proxy(order).then(function(data){
					if(data == null || data.status=="error"){
						self.blockValidation = false;
						return self.gui.show_popup('error', {
							title: 'El pago no fue procesado',
							body: data.message + " (proxy)"
						});
					}
					order.set_offline_invoice_number(data.data.offline_invoice_number);
					order.set_offline_invoice_number_int(data.data.offline_invoice_number_int);

					order.initialize_validation_date();
					order.finalized = true;

					var invoiced = self.pos.push_and_invoice_order(order);
					self.invoicing = true;

					self.gui.show_screen('receipt');

					invoiced.catch(self._handleFailedPushForInvoice.bind(self, order, false));

					invoiced.then(function (server_ids) {
						self.invoicing = false;
						var post_push_promise = [];
						post_push_promise = self.post_push_order_resolve(order, server_ids);
						post_push_promise.then(function () {
							//self.gui.show_screen('receipt');
							console.log('Comprobante enviado');
						}).catch(function (error) {
							self.gui.show_screen('receipt');
							if (error) {
								self.gui.show_popup('error',{
									'title': "Error: no internet connection",
									'body':  error,
								});
							}
						});
					});
				})
			} else {
				var ordered = this.pos.push_order(order);
				if (order.wait_for_push_order()){
					var server_ids = [];
					ordered.then(function (ids) {
					  server_ids = ids;
					}).finally(function() {
						var post_push_promise = [];
						post_push_promise = self.post_push_order_resolve(order, server_ids);
						post_push_promise.then(function () {
								self.gui.show_screen('receipt');
							}).catch(function (error) {
							  self.gui.show_screen('receipt');
							  if (error) {
								  self.gui.show_popup('error',{
									  'title': "Error: no internet connection",
									  'body':  error,
								  });
							  }
							});
					  });
				}
				else {
				  self.gui.show_screen('receipt');
				}
			}
		} else {
			this._super.apply(this, arguments);
		}
	},
});

screens.ReceiptScreenWidget.include({
	print_xml: function() {
		var self = this;
		var receipt = '';
		var order = self.pos.get_order();
		var receiptData = self.get_receipt_render_env();
		if(receiptData.order.to_invoice){
			receipt = QWeb.render('XmlInvoiceReceipt', receiptData);
		}else{
			receipt = QWeb.render('XmlReceipt', receiptData);
		}
		var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
        if(self.pos.config.ihw_open_cashbox){
            connection.rpc('/hw_proxy/open_cash');
        }
		return connection.rpc('/hw_proxy/print_xml_receipt', {
			receipt: receipt
		});
	},
});

});