odoo.define('pos_discount_increase.screens', function(require) {
	'use strict';

	var screens = require('point_of_sale.screens');
    var core = require('web.core');
	var _t = core._t;

	screens.ProductScreenWidget.include({
		start: function() {
			var self = this;
			this._super();
			$('[name=btnIncrease]').click(function(){
				var currentOrder = self.pos.get('selectedOrder');
				if(self.pos.config.only_admin_increase){
					if (self.pos.get_cashier().role != 'manager') {
						return self.gui.show_popup('error', {
							title: 'Permisos insuficientes',
							body: 'Solamente un administrador puede otorgar incrementos.'
						});
					}
				}
				if(currentOrder.orderlines.length==0){
					self.gui.show_popup('error', {
						title: 'Lineas insuficientes',
						body: 'El descuento debe aplicarse en al menos una linea.'
					});
				}else{
					if(currentOrder.global_increase){
						var confirmRemove = confirm('¿Desea remover el descuento aplicado?');
						if(confirmRemove){
							currentOrder.set_global_increase(false);
						}
					}else{
						self.gui.show_popup('apply_increase');
					}
				}
			});
			if(!self.pos.config.allow_increase){
				$('[name=btnIncrease]').remove();
			}
			$('[name=btnDiscount]').click(function(){
				var currentOrder = self.pos.get('selectedOrder');
				if(self.pos.config.only_admin_discount){
					if (self.pos.get_cashier().role != 'manager') {
						return self.gui.show_popup('error', {
							title: 'Permisos insuficientes',
							body: 'Solamente un administrador puede otorgar descuentos.'
						});
					}
				}
				if(currentOrder.orderlines.length==0){
					self.gui.show_popup('error', {
						title: _t('Lineas insuficientes'),
						body: _t('El descuento debe aplicarse en al menos una linea.')
					});
				}else{
					if(currentOrder.global_discount){
						var confirmRemove = confirm(_t('¿Desea remover el descuento aplicado?'));
						if(confirmRemove){
							currentOrder.set_global_discount(false);
						}
					}else{
						self.gui.show_popup('apply_discount');
					}
				}
			});
			if(!self.pos.config.allow_discount){
				$('[name=btnDiscount]').remove();
			}
		},
	});
});