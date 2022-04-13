odoo.define('pos_credit.screens', function(require) {
	'use strict';

	var gui = require('point_of_sale.gui');
	var screens = require('point_of_sale.screens');
	var session = require('web.session');
	var core = require('web.core');
	var rpc = require('web.rpc');

	var QWeb = core.qweb;
	var _t = core._t;

	screens.PaymentScreenWidget.include({
		renderElement: function() {
			var self = this;
			this._super();
			self.$el.find('[name=btnCredit]').click(function(){
				var order = self.pos.get('selectedOrder');
				var credit = order.get_credit();
				order.set_credit(!credit);
			});
			if(!self.pos.config.allow_credit){
				self.$el.find('[name=btnCredit]').remove();
			}
		},
		extra_validation: function(originalValidation){
			var self = this;
			var order = self.pos.get('selectedOrder');
			if(!originalValidation){
				if(order.get_credit()){
					originalValidation = true;
				}
			}
			if (order.get_orderlines().length === 0) {
				this.gui.show_popup('error',{
					'title': _t('Empty Order'),
					'body':  _t('There must be at least one product in your order before it can be validated'),
				});
				return false;
			}
			if(order.get_credit()){
				var client = order.get_client();
				if (client) {
					if(client.barcode=='CLIENTE_ANONIMO'){
						this.gui.show_popup('error', {
							title: _t('Crédito inválido'),
							body: _t(
								'No se puede dar crédito a un cliente anónimo'
							)
						});
						return false;
					}
				}else{
					this.gui.show_popup('error', {
						title: _t('Crédito inválido'),
						body: _t(
							'No se puede dar crédito a un cliente anónimo'
						)
					});
					return false;
				}
			}
			return originalValidation;
		},
		order_is_valid: function(force_validation) {
			var originalValidation = this._super(force_validation);
			return this.extra_validation(originalValidation);
		},
		validate_order: function(force_validation){
			var self = this;
			if (this.order_is_valid(force_validation)) {
				var order = self.pos.get('selectedOrder');
				if(self.pos.config.limit_credit&&order.get_credit()){
					rpc.query({
						model: 'res.partner',
						method: 'search_read',
						domain: [['id','=',order.get_client().id]],
						fields: ['credit_limit','credit'],
					}).then(function(returned_value) {
						if(returned_value[0].credit_limit<(order.get_total_with_tax()+returned_value[0].credit) && order.get_payment_term_id()!=1 && !order.get_credit_note()){
							self.gui.show_popup('error', {
								title: _t('Crédito inválido'),
								body: _t(
									'Se está excediendo el crédito del cliente.'
								)
							});
						}else{
							self.finalize_validation();
						}
					});
				}else{
					// FIX: no existe set_payment_term
					if (typeof order.set_payment_term === 'function'){
						order.set_payment_term(1);
					}
					this._super();
				}
			}
		}
	});
	
});