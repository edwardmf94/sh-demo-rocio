odoo.define('l10n_pe_pos_itgrupo.screens', function (require) {
"use strict";

var core = require('web.core');
var screens = require('point_of_sale.screens');
var screensPePos = require('l10n_pe_pos.screens');
var rpc = require('web.rpc');

var _t = core._t;

var PaymentScreenWidget = screens.PaymentScreenWidget;
PaymentScreenWidget.include({
	show: function(){
		var self = this;
		this._super.apply(this, arguments);
		this.$('.js_journal').remove();
		var order = self.pos.get_order();
		self.pos.itgrupo_series.forEach(function(serie){
	        var document_type = {};
	        var itserie = self.pos.itgrupo_series.find(function(item){
	            return item.id == serie.id;
	        });
	        var document_type = self.pos.itgrupo_catalog.find(function(item){
	            return item.id == itserie.document_type_id[0];
	        });
	        if(order.get_credit_note()){
		        if(document_type.code!='07'){
		        	self.$('.js_journalit[data-journal='+serie.id+']').hide();
		        }
		    }else{
		    	if(document_type.code=='07'){
		        	self.$('.js_journalit[data-journal='+serie.id+']').hide();
		        }
		    }
	    });
	},
	renderElement: function(){
		var self = this;
		this._super.apply(this, arguments);

		self.$('.js_journalit').click(function(){
			self.click_journalit(parseInt($(this).attr('data-journal')));
		});
	},
	click_journalit: function(journal){
		var self = this;
		var order = self.pos.get_order();
		var currentJournal = order.get_sale_journalit();
		if(currentJournal!=journal){
			order.set_sale_journalit(journal);
			this.$('.js_journalit').removeClass('highlight');
			this.$('.js_journalit[data-journal='+journal+']').addClass('highlight');
		}else{
			order.set_sale_journalit(false);
			this.$('.js_journalit').removeClass('highlight');
		}
	},
	pe_validation: function(){
		var self = this;
		var result = this._super();
		var order = self.pos.get_order();
		console.log('Va a validar ticket?',self.pos.config.allow_ticket);
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
			console.log('order it',order.get_sale_journalit());
			if(!order.get_sale_journalit()){
				self.gui.show_popup('error',{
					title: 'Emisión inválida',
					body: 'Solamente se debe emitir boletas o facturas'
				});
				return false;
			}
		}
		console.log('Original Validation',{result});
		if(order.is_to_invoice()){
			/*var client = order.get_client();
			if(!client){
				self.gui.show_popup('error',{
					title: _t('Customer required'),
					body:  _t('If you want to valid an invoice, you need to select a valid customer'),
				});
				return false;
			}
			var sequence_id = order.get_sale_journal();
			var sequence = self.pos.journal_sale_ids.find(function(item){
				return item.id == sequence_id;
			});
			if (sequence){
				var document_type = self.pos.documents_sale.find(function(item){
					return item.id == sequence.l10n_latam_document_type_id[0];
				});
			}
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
			}*/
		}
		return true;
	},
	generate_uid_coupon: function(sequence,index){
		var self = this;
		function zero_pad(num,size){
			var s = ""+num;
			while (s.length < size) {
				s = "0" + s;
			}
			return s;
		}
		return zero_pad(self.pos.pos_session.id,5) +
			zero_pad(self.pos.pos_session.login_number,1) +
			zero_pad(sequence,1)+
			zero_pad(index,1);
	}
});

screens.ReceiptScreenWidget.include({
    get_receipt_render_env: function() {
    	var result = this._super();
        var receipt_screen_params = this.pos
            .get_order()
            .get_screen_data('params');
        if(receipt_screen_params){
            if(receipt_screen_params.data){
                return result;
            }
        }
        var order = this.pos.get_order();
        var serie = order.get_sale_journalit();
        if(!serie){
        	return result;
        }
        var document_type = {};
        var itserie = this.pos.itgrupo_series.find(function(item){
            return item.id == serie;
        });
        var document_type = this.pos.itgrupo_catalog.find(function(item){
            return item.id == itserie.document_type_id[0];
        });
        result.document_type = document_type;
    	return result;
    }
});

screensPePos.PosOrderListScreenWidget.include({
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
		if(moment().diff(moment(orderDate.substr(0,10), "DD/MM/YYYY"),'days')>1 && journalType!=='0000'){
			return self.gui.show_popup('error-traceback', {
				title: _t('INFORMACIÓN REQUERIDA'),
				body: _t('No se puede anular un comprobante con más de 1 día. Se debe emitir una Nota de Crédito.')
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
	other_process: function(data){
		var self = this;
		var orderPos = self.pos.get_order();
		orderPos.set_refund_id(data.account_move);
		orderPos.set_credit_note_origin(data.account_move_ref);
		orderPos.set_credit_note_origin_type(data.journal_type);
		orderPos.set_credit_note_type(data.creditNote);
		orderPos.set_credit_note(true);
		return true;
	},
	_get_load_fields_order: function(){
    	var result = this._super();
    	result.push('offline_invoice_number');
    	return result;
	}
})
});