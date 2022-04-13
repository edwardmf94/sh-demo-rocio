odoo.define('l10n_pe_pos_yaros.screens', function (require) {
	"use strict";

	var core = require('web.core');
	var screens = require('point_of_sale.screens');
	var screensPePos = require('l10n_pe_pos.screens');
	var rpc = require('web.rpc');

	var _t = core._t;

	var PaymentScreenWidget = screens.PaymentScreenWidget;
	PaymentScreenWidget.include({
		show: function () {
			var self = this;
			this._super.apply(this, arguments);
			this.$('.js_journal').remove();
			var order = self.pos.get_order();
			self.pos.yaros_series.forEach(function (serie) {
				var document_type = {};
				var yarosserie = self.pos.yaros_series.find(function (item) {
					return item.id == serie.id;
				});
				var document_type = self.pos.yaros_catalog.find(function (item) {
					return item.id == yarosserie.invoice_document_type_id[0];
				});
				if (order.get_credit_note()) {
					if (document_type.code != '07') {
						self.$('.js_journalyaros[data-journal=' + serie.id + ']').hide();
					}
				} else {
					if (document_type.code == '07') {
						self.$('.js_journalyaros[data-journal=' + serie.id + ']').hide();
					}
				}
			});
		},
		renderElement: function () {
			var self = this;
			this._super.apply(this, arguments);

			self.$('.js_journalyaros').click(function () {
				self.click_journalyaros(parseInt($(this).attr('data-journal')));
			});
		},
		click_journalyaros: function (journal) {
			var self = this;
			var order = self.pos.get_order();
			var currentJournal = order.get_sale_journalyaros();
			if (currentJournal != journal) {
				order.set_sale_journalyaros(journal);
				this.$('.js_journalyaros').removeClass('highlight');
				this.$('.js_journalyaros[data-journal=' + journal + ']').addClass('highlight');
			} else {
				order.set_sale_journalyaros(false);
				this.$('.js_journalyaros').removeClass('highlight');
			}
		},
		pe_validation: function (force_validation) {
			var self = this;
			var result = this._super();
			var order = self.pos.get_order();
			if (order.is_to_invoice()) {
				var client = order.get_client();
				var client_document_type = self.pos.documents_sunat.find(function(item){
					return item.id == client.l10n_latam_identification_type_id[0];
				});
				var client_doc_type = client_document_type.l10n_pe_vat_code;
				var order_doc_type = order.get_document_type();
				if(order_doc_type.code=='01'){
					if(client_doc_type!='6'){
						self.gui.show_popup('error',{
							title: _t('Customer required'),
							body:  _t('Se debe emitir factura a un RUC'),
						});
						return false;
					}
				}else if(order_doc_type.code=='03'){
					if(client_doc_type=='6'&&!force_validation){
						self.gui.show_popup('confirm',{
							title: 'Confirme cliente con RUC',
							body:  'Va a emitir una boleta a un RUC ' + 
								   '? Haga click en "Confirmar" para confirmar esto.',
							confirm: function() {
								self.validate_order('confirm');
							},
						});
						return false;
					}
				}
			}
			return true;
		}
	});

	screens.ReceiptScreenWidget.include({
		get_receipt_render_env: function () {
			var result = this._super();
			var order = this.pos.get_order();
			var serie = order.get_sale_journalyaros();
			var receipt_screen_params = this.pos
				.get_order()
				.get_screen_data('params');
			if(receipt_screen_params){
				if(receipt_screen_params.data){
					result.order.yaros_prefix_val = receipt_screen_params.data.prefix_val;
					result.order.yaros_suffix_val = receipt_screen_params.data.suffix_val;
					return result;
				}
			}
			if (!serie) {
				return result;
			}
			var document_type = {};
			var yarosserie = this.pos.yaros_series.find(function (item) {
				return item.id == serie;
			});
			var document_type = this.pos.yaros_catalog.find(function (item) {
				return item.id == yarosserie.invoice_document_type_id[0];
			});
			result.document_type = document_type;
			return result;
		}
	});

});