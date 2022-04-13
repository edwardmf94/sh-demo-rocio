odoo.define('l10n_pe_pos.screens', function (require) {
"use strict";
var core = require('web.core');
var rpc = require('web.rpc');
var utils = require('web.utils');
var framework = require('web.framework');
var screens = require('point_of_sale.screens');
var historyScreens = require('pos_history.screens');

var QWeb = core.qweb;
var _t = core._t;

var round_pr = utils.round_precision;

framework.blockUI = function(){
	/*var tmp = $.blockUI.apply($, arguments);
	var throbber = new Throbber();
	throbbers.push(throbber);
	throbber.appendTo($(".oe_blockui_spin_container"));
	$(document.body).addClass('o_ui_blocked');
	blockAccessKeys();
	return tmp;*/
	return false;
}

var ClientListScreenWidget = screens.ClientListScreenWidget;
ClientListScreenWidget.include({
	display_client_details: function(visibility,partner,clickpos){
		this._super.apply(this, arguments);
		if (visibility === 'edit') {
			var client_tag = $('.client-name');
			if(client_tag){
				client_tag.change(function() {
					var social_reason = $('.client-social_reason');
					if(!social_reason.val()){
						social_reason.val(client_tag.val());
					}
					var tradename =$('.client-tradename');
					if(!tradename.val()){
						tradename.val(client_tag.val());
					}
				});
			}
		}
		var self = this;
		var contents = self.$('.client-details-contents');

		contents.off('click','.button.ruc_validation'); 
		contents.on('click','.button.ruc_validation',function(){ self.ruc_validation(partner); });
	},
	ruc_validation: function(partner){
		var self = this;
		var fields = {};
		this.$('.client-details-contents .detail').each(function(idx,el){
			if(['vat', 'l10n_latam_identification_type_id'].indexOf(el.name) != -1){
				fields[el.name] = el.value;
			}
		});
		fields.id = partner.id || false;
		if (!fields.vat) {
			self.gui.show_popup('error', {
				'title': ('Error: Completar campos'),
				'body': 'El campo "N° Documento" se encuentra vacío.',
			});
			return;
		}
		if (!fields.l10n_latam_identification_type_id) {
			self.gui.show_popup('error', {
				'title': ('Error: Completar campos'),
				'body': 'El campo "Tipo Documento" se encuentra vacío.',
			});
			return;
		}

		var contents = this.$(".client-details-contents");
		contents.off("click", ".button.ruc_validation");
		rpc.query({
			model: 'res.partner',
			method: 'action_validate_sunat',
			args: [fields],
		}).then(function(partner_id){
			if(!partner_id){
					self.gui.show_popup('error',{
						'title': "UPPS!",
					'body':   "No se puede realizar la consulta, porque el servicio de SUNAT está demorando en Responder, o su conexión a Internet es demasiado lenta. Pruebe haciendo la consulta manual directo en la página de consulta RUC de SUNAT, porque si el servicio de SUNAT presenta problemas de lentitud, Odoo no se conectará para evitar afectar el rendimiento del sistema.",
					});
				contents.on('click','.button.ruc_validation',function(){ self.ruc_validation(partner); });
			}else{
				self.saved_client_details(partner_id);
			}
		},function(err,ev){
			ev.preventDefault();
			var error_body = _t('Your Internet connection is probably down.');
			if (err.data) {
				var except = err.data;
				error_body = except.arguments && except.arguments[0] || except.message || error_body;
			}
			contents.on('click','.button.ruc_validation',function(){ self.ruc_validation(partner); });
		});
	},
	perform_search: function(query, associate_result) {
		var self = this;
		var customers;
		if (query) {
			customers = this.pos.db.search_partner(query);
			this.display_client_details('hide');
			if (associate_result && customers.length === 1) {
				this.new_client = customers[0];
				this.save_changes();
				this.gui.back();
				if (this.adv_inv != null) {
					this.gui.show_popup('popup_advance', this.adv_inv);
				} else if (this.cre_inv != null) {
					this.gui.show_popup('popup_contract', this.cre_inv);
				}
			} else if (associate_result && customers.length == 0) {
				if (query.length == 11 && !isNaN(query)) {
					this.chrome.loading_show();
					rpc
						.query({
							model: 'res.partner',
							method: 'weservice_peru',
							args: ['6', query]
						})
						.then(function(response) {
							self.chrome.loading_hide();
							if (response.status == 'success') {
								self.display_client_details('edit', {
									zip: response.data.zip,
									country_id: self.pos.company.country_id,
									name: response.data.name,
									vat: query,
									street: response.data.street
								});
								self.$('.client-document-type').val(response.data.l10n_latam_identification_type_id); 
								self.$('.client-document-type').change();
								self.$('.client-details-contents .button.save').click();
								self.save_changes();
							} else {
								self.gui.show_popup('error', {
									title: _t('Error detected'),
									body: response.message
								});
							}
						});
				} else if (query.length == 8 && !isNaN(query)) {
					this.chrome.loading_show();
					rpc
						.query({
							model: 'res.partner',
							method: 'weservice_peru',
							args: ['1', query]
						})
						.then(function(response) {
							self.chrome.loading_hide();
							if (response.status == 'success') {
								self.display_client_details('edit', {
									country_id: self.pos.company.country_id,
									name: response.data.name,
									vat: query,
									street: ''
								});
								self.$('.client-document-type').val(response.data.l10n_latam_identification_type_id); 
								self.$('.client-document-type').change();
								self.$('.client-details-contents .button.save').click();
								self.save_changes();
							} else {
								self.gui.show_popup('error', {
									title: _t('Error detected'),
									body: response.message
								});
							}
						});
				}
			}
			this.render_list(customers);
		} else {
			customers = this.pos.db.get_partners_sorted();
			this.render_list(customers);
		}
	},
});

var PaymentScreenWidget = screens.PaymentScreenWidget;
PaymentScreenWidget.include({
	show: function(){
		var self = this;
		this._super.apply(this, arguments);
		this.$('.js_invoice').remove();
	},
	renderElement: function(){
		var self = this;
		this._super.apply(this, arguments);

		self.$('.js_journal').click(function(){
			self.click_journal(parseInt($(this).attr('data-journal')));
		});
	},
	click_journal: function(journal){
		var self = this;
		var order = self.pos.get_order();
		var currentJournal = order.get_sale_journal();
		if(currentJournal!=journal){
			order.set_sale_journal(journal);
			this.$('.js_journal').removeClass('highlight');
			this.$('.js_journal[data-journal='+journal+']').addClass('highlight');
		}else{
			order.set_sale_journal(false);
			this.$('.js_journal').removeClass('highlight');
		}
	},
	order_is_valid: function(force_validation) {
		var self = this;
		var pe_is_paid = self.pe_is_paid(force_validation);
		var originalValidation = this._super.apply(this, arguments);
		if(!originalValidation) return false;
		if(!pe_is_paid && originalValidation) pe_is_paid = true;
		if(pe_is_paid){
			var pe_basic_result = self.pe_basic_validation(force_validation);
			if(pe_basic_result){
				var pe_result = self.pe_validation(force_validation);
				if(pe_result){
					return true;
				}else{
					return false;
				}
			}else{
				return false;
			}
		}else{
			return false;
		}
	},
	pe_is_paid: function(force_validation){
		var self = this;
		var order = self.pos.get_order();

		if (!order.is_paid() || this.invoicing) {
			return false;
		}

		// The exact amount must be paid if there is no cash payment method defined.
		if (Math.abs(order.get_total_balance()) > 0.00001) {
			var cash = false;
			for (var i = 0; i < this.pos.payment_methods.length; i++) {
				cash = cash || (this.pos.payment_methods[i].is_cash_count);
			}
			if (!cash) {
				this.gui.show_popup('error',{
					title: _t('Cannot return change without a cash payment method'),
					body:  _t('There is no cash payment method available in this point of sale to handle the change.\n\n Please pay the exact amount or add a cash payment method in the point of sale configuration'),
				});
				return false;
			}
		}
		return true;
	},
	pe_basic_validation: function(force_validation){
		var self = this;
		var order = self.pos.get_order();
		if (order.get_orderlines().length === 0) {
			this.gui.show_popup('error',{
				'title': _t('Empty Order'),
				'body':  _t('There must be at least one product in your order before it can be validated'),
			});
			return false;
		}
		var client = order.get_client();
		if (order.is_to_email() && (!client || client && !utils.is_email(client.email))) {
			var title = !client
				? _t('Please select the customer')
				: _t('Please provide valid email');
			var body = !client
				? _t('You need to select the customer before you can send the receipt via email.')
				: _t('This customer does not have a valid email address, define one or do not send an email.');
			this.gui.show_popup('confirm', {
				'title': title,
				'body': body,
				confirm: function () {
					this.gui.show_screen('clientlist');
				},
			});
			return false;
		}
		// if the change is too large, it's probably an input error, make the user confirm.
		if (!force_validation && order.get_total_with_tax() > 0 && (order.get_total_with_tax() * 1000 < order.get_total_paid())) {
			this.gui.show_popup('confirm',{
				title: _t('Please Confirm Large Amount'),
				body:  _t('Are you sure that the customer wants to  pay') + 
					   ' ' + 
					   this.format_currency(order.get_total_paid()) +
					   ' ' +
					   _t('for an order of') +
					   ' ' +
					   this.format_currency(order.get_total_with_tax()) +
					   ' ' +
					   _t('? Clicking "Confirm" will validate the payment.'),
				confirm: function() {
					self.validate_order('confirm');
				},
			});
			return false;
		}
		if(order.is_to_invoice()){
			if(!client){
				self.gui.show_popup('error',{
					title: _t('Customer required'),
					body:  _t('If you want to valid an invoice, you need to select a valid customer'),
				});
				return false;
			}
			var errorQty = false;
			var errorZero = false;
			_(order.get_orderlines()).each(function(line){
				if(line.quantity <= 0){
					errorQty = line.product.display_name;
				}
				if(line.price == 0){
					errorZero = line.product.display_name;
				}
			});
			if(errorQty && !order.get_credit_note()){
				self.gui.show_popup('error', {
					title: _t('Cantidad invalida'),
					body: _t('No puede vender 0 unidades o menos en ' + errorQty)
				});
				return false;
			}
			if(errorZero){
				self.gui.show_popup('error', {
					title: _t('Precio invalido'),
					body: _t('No puede vender a 0 soles')
				});
				return false;
			}
		}
		if(order.get_credit()){
			var payment_term = client.property_payment_term_id[0];
			if(!payment_term){
				self.gui.show_popup('error', {
					title: 'Venta invalida',
					body: 'No se habilito credito para este cliente.'
				});
				return false;
			}
			if(payment_term == self.pos.config.cash_payment_term_id[0]){
				self.gui.show_popup('error', {
					title: 'Venta invalida',
					body: 'No se habilito credito para este cliente.'
				});
				return false;
			}
			if(order.get_payment_term_id() == self.pos.config.cash_payment_term_id[0]){
				order.set_payment_term_id(payment_term);
			}
		}
		return true;
	},
	pe_validation: function(force_validation){
		var self = this;
		var order = self.pos.get_order();
		if(!self.pos.config.allow_ticket){
			if(!order.get_client()){
				self.gui.show_popup('error',{
					title: 'Emisión inválida',
					body: 'Solamente se debe emitir boletas o facturas'
				});
				return false;
			}
			if(!order.is_to_invoice()){
				self.gui.show_popup('error',{
					title: 'Emisión inválida',
					body: 'Solamente se debe emitir boletas o facturas'
				});
				return false;
			}
			if(!order.get_sale_journal()){
				self.gui.show_popup('error',{
					title: 'Emisión inválida',
					body: 'Solamente se debe emitir boletas o facturas'
				});
				return false;
			}
		}
		if(order.is_to_invoice()){
			var client = order.get_client();
			var sequence_id = order.get_sale_journal();
			var sequence = self.pos.journal_sale_ids.find(function(item){
				return item.id == sequence_id;
			});
			var document_type = false;
			if (sequence){
				document_type = self.pos.documents_sale.find(function(item){
					return item.id == sequence.l10n_latam_document_type_id[0];
				});
			}
			if(document_type){
				if(document_type.code=='01'){
					var client_document_type = self.pos.documents_sunat.find(function(item){
						return item.id == client.l10n_latam_identification_type_id[0];
					});
					if(client_document_type.l10n_pe_vat_code != '6'){
						self.gui.show_popup('error',{
							title: _t('Customer invalid'),
							body:  _t('If you want to valid an invoice, you need to select a valid customer with a RUC'),
						});
						return false;
					}
				}else if(document_type.code=='03'){
					//
				}
			}
		}
		return true;
	}
});

var PosOrderListScreenWidget = historyScreens.PosOrderListScreenWidget;
PosOrderListScreenWidget.include({
	start: function() {
		var self = this;
		this._super();
		this.$el.find('[name=btnAnnul]').click(function() {
			self.click_annul();
		});
		
		this.$el.find('[name=btnNCredit]').click(function() {
			self.click_creditnote();
		});
		if(!self.pos.config.allow_credit_note){
			self.$('[name=btnNCredit]').remove();
		}
	},
	click_annul: function(){
		var self = this;
		var order = self.$('.pos-orders-contents .highlight');
		var orderCancel = order.attr('data-order-cancel');
		var orderDate = order.attr('data-order-date');
		var journalType = order.attr('data-order-journal');
		var orderId = parseInt(order.attr('data-order-id'));
		if(isNaN(orderId)) return false;
		if(orderCancel=='true'){
			return self.gui.show_popup('error-traceback', {
				title: _t('INFORMACIÓN REQUERIDA'),
				body: _t('No se puede anular un comprobante ya anulado.')
			});
		}
		if(moment().diff(moment(orderDate.substr(0,10), "DD/MM/YYYY"),'days')>7 && journalType!=='0000'){
			return self.gui.show_popup('error-traceback', {
				title: _t('INFORMACIÓN REQUERIDA'),
				body: _t('No se puede anular un comprobante con más de 7 días. Se debe emitir una Nota de Crédito.')
			});
		}
		if (order.length > 0) {
			if(self.pos.config.control_annul){
				if (self.pos.get_cashier().role === 'manager') {
					self.gui.show_popup('confirm', {
						title: _t('CONFIRMAR OPERACIÓN'),
						body:
							'Se procederá a anular la orden ' + order.attr('data-order-name'),
						confirm: function() {
							rpc
								.query({
									model: 'pos.order',
									method: 'btnCancel',
									args: [
										parseInt(order.attr('data-order-id')),
										self.pos.config.session_ids[0]
									]
								})
								.then(function(returned_value) {
									self.gui.show_screen('products');
									self.gui.show_popup('error-traceback', {
										title: _t('ANULACIÓN COMPLETA'),
										body: _t('Se anuló con éxito el comprobante')
									});
								});
						}
					});
				} else {
					self.gui.show_popup('error', {
						title: _t('Permisos insuficientes'),
						body: _t('El usuario no puede acceder al resumen debido a falta de permisos!')
					});
				}
			}else{
				self.gui.show_popup('confirm', {
					title: _t('CONFIRMAR OPERACIÓN'),
					body:
						'Se procederá a anular la orden ' + order.attr('data-order-name'),
					confirm: function() {
						rpc
							.query({
								model: 'pos.order',
								method: 'btnCancel',
								args: [
									parseInt(order.attr('data-order-id')),
									self.pos.config.session_ids[0]
								]
							})
							.then(function(returned_value) {
								var titleshow = 'ANULACIÓN COMPLETA';
								if (returned_value.refund === false){
									titleshow = "HUBO UN PROBLEMA";
								}
								self.gui.show_screen('products');
								self.gui.show_popup('error-traceback', {
									title: titleshow,
									body: returned_value.rpta
								});
							});
					}
				});
			}
		} else {
			self.gui.show_popup('error-traceback', {
				title: _t('INFORMACIÓN REQUERIDA'),
				body: _t('Debe seleccionar una orden para continuar')
			});
		}
	},
	click_creditnote: function(){
		var self = this;
		var order = self.$('.pos-orders-contents .highlight');
		if (order.length > 0) {
			var orderId = parseInt(order.attr('data-order-id'));
			if(isNaN(orderId)) return false;
			var orderName = order.attr('data-order-name');
			var orderCancel = order.attr('data-order-cancel');
			var invoiceNumber = order.attr('data-order-invoice-number');
			if(invoiceNumber=='false'){
				return self.gui.show_popup('error-traceback', {
					title: _t('OPERACION INVALIDA'),
					body: _t('No se puede emitir una nota de credito a un ticket de venta. Se debe anular la operación y duplicar modificando lo deseado.')
				});
			}
			if(orderCancel=='true'){
				return self.gui.show_popup('error-traceback', {
					title: _t('INFORMACIÓN REQUERIDA'),
					body: _t('No se puede emitir una nota de credito a un comprobante ya anulado.')
				});
			}
			self.gui.show_popup('credit_note', {origin: invoiceNumber, cb: function(creditType, creditMotive){
				rpc.query({
					model: 'pos.order',
					method: 'get_print',
					args: [parseInt(orderId)]
				})
				.then(function(returnedJson) {
					returnedJson.creditNote = creditType;
					self.load_from_backend(returnedJson, function() {
						var orderPos = self.pos.get_order();
						self.gui.show_screen('products');
					}, true);
				});
			}});
		} else {
			self.gui.show_popup('error-traceback', {
				title: _t('INFORMACIÓN REQUERIDA'),
				body: _t('Debe seleccionar una orden para continuar')
			});
		}
	},
	get_detail_line_from_backend: function(line, data) {
		var result = this._super(line, data);
		var lineQty = line.quantity;
		if(data.creditNote){
			lineQty = -lineQty;
		}
		result['quantity'] = lineQty
		return result
	},
	_get_load_fields_order: function(){
		var result = this._super();
		result.push('cancel')
		return result;
	},
	other_validation: function(data){
		return data.creditNote;
	},
	other_process: function(data){
		var self = this;
		var orderPos = self.pos.get_order();
		orderPos.set_refund_id(data.account_move);
		orderPos.set_credit_note_origin(data.invoice_name);
		orderPos.set_credit_note_origin_type(data.journal_type);
		orderPos.set_credit_note_type(data.creditNote);
		orderPos.set_credit_note(true);
		return true;
	},
	load_from_backend: function(data, cb, isCreditNote) {
		var self = this;
		var orderPos = self.pos.get_order();
		orderPos.destroy();
		orderPos = self.pos.get_order();
		var client;
		$.each(data.orderlines, function() {
			var line = this;
			var product = self.pos.db.get_product_by_id(line.product_id);
			var detail_line = self.get_detail_line_from_backend(line, data);
			if(isCreditNote!==undefined){
				if(detail_line.discount>0){
					detail_line.price = detail_line.price - (detail_line.price * (detail_line.discount/100));
					detail_line.discount = 0;
				}
			}
			orderPos.add_product(product, detail_line);
			var selected_orderline = orderPos.get_selected_orderline();
			selected_orderline.price_manually_set = true;
			if(selected_orderline.set_uom!==undefined)
				selected_orderline.set_uom({0:line.unit_id,1:line.unit_name});
		});
		if (data.client_id) {
			client = self.pos.db.get_partner_by_id(data.client_id);
			if (!client) {
				console.error(
					'ERROR: trying to load a parner not available in the pos'
				);
			}
		} else {
			client = null;
		}

		if(self.other_validation(data)){
			self.other_process(data)
		} else {
			orderPos.set_sale_journal(data.journal_id);
		}

		orderPos.set_client(client);
		if (data.journal_id != self.pos.config.journal_id[0]) {
			orderPos.set_to_invoice(true);
		}
		cb();
	}
});

return {
	PosOrderListScreenWidget: PosOrderListScreenWidget
};

});