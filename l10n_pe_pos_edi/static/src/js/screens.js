odoo.define('l10n_pe_pos_edi.screens', function(require) {
'use strict';

var screens = require('point_of_sale.screens');
var core = require('web.core');
var rpc = require('web.rpc');
var historyScreens = require('pos_history.screens');

var QWeb = core.qweb;


var PaymentScreenWidget = screens.PaymentScreenWidget;
PaymentScreenWidget.include({
	finalize_validation: function() {
		var self = this;
		var order = this.pos.get_order();

		if ((order.is_paid_with_cash() || order.get_change()) && this.pos.config.iface_cashdrawer) { 
				this.pos.proxy.printer.open_cashbox();
		}

		order.initialize_validation_date();
		order.finalized = true;

		if (order.is_to_invoice()) {
			order.generate_sequence();
			var invoiced = this.pos.push_and_invoice_order(order);
			this.invoicing = true;

			self.gui.show_screen('receipt');

			setTimeout(function(){
				self.invoicing = false;
			},3000);

			//invoiced.catch(this._handleFailedPushForInvoice.bind(this, order, false));
			invoiced.catch(function(){
				self.invoicing = false;
			});

			invoiced.then(function (server_ids) {
				self.invoicing = false;
				var post_push_promise = [];
				post_push_promise = self.post_push_order_resolve(order, server_ids);
				post_push_promise.then(function () {
					//self.gui.show_screen('receipt');
					$('.js_synch').click();
				}).catch(function (error) {
					//self.gui.show_screen('receipt');
					if (error) {
						self.gui.show_popup('error',{
							'title': "Error: no internet connection",
							'body':  error,
						});
					}
				});
			});
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
	},
});

screens.ReceiptScreenWidget.include({
	get_receipt_render_env: function() {
		var self = this;
		var receipt_screen_params = this.pos
			.get_order()
			.get_screen_data('params');
		var order = this.pos.get_order();
		var sequence_id = order.get_sale_journal();
		var sequence = false;
		var document_type = {};
		var client = order.get_client();
		var payment_term = false;
		var client_document_type = {};
		var company_branch = false;
		if(this.pos.config.company_branch_address_id){
			company_branch = this.pos.db.get_partner_by_id(this.pos.config.company_branch_address_id[0]);
		}
		var isReprint = false;
		if(receipt_screen_params){
			if(receipt_screen_params.data){
				isReprint = true;
				var oldData = receipt_screen_params.data;
				if(oldData.payment_term) payment_term = oldData.payment_term;
				else payment_term = 'CONTADO';
				order = {
					offline_invoice_number: oldData.invoice_name,
					get_client: function(){
						return {
							vat: oldData.client_vat,
							street: oldData.client_street
						}
					},
					get_client_name: function(){
						return oldData.client
					},
					get_client_name_xml: function(){
						return oldData.client
					},
					get_date_due: function(){
						return oldData.invoice_date;
					},
					get_payment_term: function(){
						return payment_term;
					},
					get_credit_note_type_name: function(){
						return oldData.credit_note_type;
					},
					get_credit_note_origin: function(){
						return oldData.credit_note_origin;
					},
					get_qr: function() {
						return oldData.qr_string;
					},
					export_for_printing: function(){
						return {
							header: self.pos.config.header,
							footer: self.pos.config.footer,
							date: {
								localestring: oldData.date_order
							}
						};
					},
					getAmountText: function(){
						return self.pos.get_order().getCantText(oldData.subtotal);
					},
					get_orderlines: function(){
						return oldData.orderlines.map(function(item){
							return {
								product_name: item.product_name,
								get_product_xml: function(){
									return item.product_name;
								},
								get_discount: function(){
									return item.discount;
								},
								get_quantity_str_with_unit: function(){
									return item.qty;
								},
								get_quantity_credit: function(){
									return item.qty;
								},
								get_unit_price: function(){
									return item.price_unit;
								},
								get_display_price: function(){
									return item.price_with_tax;
								},
								get_display_price_credit: function(){
									return item.price_with_tax;
								},
								get_uom_str: function(){
									return item.unit_name;
								}
							};
						});
					},
					get_paymentlines: function(){
						return oldData.paymentlines.filter(function(item){
							return item.amount > 0;
						})
							.map(function(item){
							return {name: item.name,get_amount: function(){ return item.amount; }};
						});
					},
					get_total_without_tax: function(){
						return oldData.amount_subtotal;
					},
					get_total_exonerated: function(){
						return oldData.amount_exonerated;
					},
					get_total_innafected: function(){
						return oldData.amount_innafected;
					},
					get_total_gift: function(){
						return oldData.amount_free;
					},
					get_tax_details: function(){
						return [{name: 'IGV',amount: oldData.amount_igv}];
					},
					get_total_discount: function(){
						return 0;
					},
					get_total_with_tax: function(){
						return oldData.subtotal;
					},
					get_total_with_tax_credit: function(){
						return oldData.subtotal;
					},
					get_change: function(){
						return oldData.change;
					},
					getTotalItems: function(){
						return oldData.orderlines.length;
					},
					to_invoice: false
				};
				if(oldData.invoice_name.substr(0,1)=='B' || oldData.invoice_name.substr(0,1)=='F'){
					order.to_invoice = true;
				}
				client_document_type = {
					name: oldData.client_doc_type
				};
				document_type = {
					code: oldData.document_type
				};
				return {
					widget: this,
					reprint: true,
					pos: this.pos,
					company_branch: company_branch,
					document_type: document_type,
					client_document_type: client_document_type,
					payment_term: payment_term,
					sequence: sequence,
					order: order,
					receipt: order.export_for_printing(),
					orderlines: order.get_orderlines(),
					paymentlines: order.get_paymentlines(),
				};
			}
		}
		if(sequence_id){
			sequence = this.pos.journal_sale_ids.find(function(item){
				return item.id == sequence_id;
			});
			if (sequence){
				document_type = this.pos.documents_sale.find(function(item){
					return item.id == sequence.l10n_latam_document_type_id[0];
				});
			}
		}

		if (client){
			client_document_type = this.pos.documents_sunat.find(function(item){
				return item.id == client.l10n_latam_identification_type_id[0];
			});
			payment_term = this.pos.payment_term_ids.find(function (item) {
				return item.id == client.property_payment_term_id[0];
			});
			if(!isReprint){
				payment_term = this.pos.payment_term_ids.find(function (item) {
					return item.id == order.get_payment_term_id();
				});
			}
		}
		if (payment_term) payment_term = payment_term.name;
		else payment_term = 'CONTADO';

		return {
			widget: this,
			pos: this.pos,
			reprint: false,
			company_branch: company_branch,
			document_type: document_type,
			client_document_type: client_document_type,
			payment_term: payment_term,
			sequence: sequence,
			order: order,
			receipt: order.export_for_printing(),
			orderlines: order.get_orderlines(),
			paymentlines: order.get_paymentlines(),
		};
	},
	show: function() {
		this._super();
		var self = this;
		if (!self.gui.pos.config.is_posbox) {
			this.render_change();
			if (this.pos.get_order().finalized && this.pos.get_order().to_invoice && this.pos.get_order().offline_invoice_number) {
				self.printType = 'PosTicketInvoice';
			}
			this.render_receipt();
		}
		if(this.pos.get_order()){
			var receipt_render = self.get_receipt_render_env()
			if(this.pos.get_order().to_invoice && receipt_render.order.get_qr){
				setTimeout(function(){
					self.$('.pos-receipt-qrcode').qrcode({
						width: 90,
						height: 90,
						text: receipt_render.order.get_qr()
					});
				},100);
			}
		}
	},
	render_receipt: function() {
		var self = this;
		var receipt_screen_params = this.pos
			.get_order()
			.get_screen_data('params');
		if(receipt_screen_params){
			if(receipt_screen_params.data){
				return this.$('.pos-receipt-container').html(
					QWeb.render('PosTicketInvoice', this.get_receipt_render_env())
				);
			}
		}
		if (this.printType) {
			this.$('.pos-receipt-container').html(
				QWeb.render(this.printType, this.get_receipt_render_env())
			);
		} else {
			if (this.pos.get_order().to_invoice && this.pos.get_order().offline_invoice_number) {
				this.$('.pos-receipt-container').html(
					QWeb.render('PosTicketInvoice', this.get_receipt_render_env())
				);
			} else {
				this.$('.pos-receipt-container').html(
					QWeb.render('OrderReceipt', this.get_receipt_render_env())
				);
			}
		}
	},
});

var PosOrderListScreenWidget = historyScreens.PosOrderListScreenWidget;
PosOrderListScreenWidget.include({
	start: function() {
		var self = this;
		this._super();
		this.$el.find('[name=btnReprint]').click(function(){
			self.click_reprint();
		});
	},
	click_reprint: function(){
		var self = this;
		var order = self.$('.pos-orders-contents .highlight');
		var orderId = parseInt(order.attr('data-order-id'));
		if(isNaN(orderId)) return false;
		if (order.length > 0) {
			rpc.query({
				model: 'pos.order',
				method: 'get_print',
				args: [
					parseInt(order.attr('data-order-id'))
				]
			})
			.then(function(jsonData) {
				self.gui.show_screen('receipt',{data: jsonData});
			});
		} else {
			self.gui.show_popup('error-traceback', {
				title: _t('INFORMACION REQUERIDA'),
				body: _t('Debe seleccionar una orden para continuar')
			});
		}
	}
});

});