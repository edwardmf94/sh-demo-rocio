odoo.define('pos_discount_increase.popups', function(require) {
	'use strict';

	var gui = require('point_of_sale.gui');
	var PopupWidget = require('point_of_sale.popups');

	var GlobalDiscountPopup = PopupWidget.extend({
		template: 'SelectionPopupWidget',
		show: function(options) {
			var self = this;
			options = options || {};
			this._super(options);

			this.title = 'Aplicar descuento';
			this.list = self.pos.db.pos_discount.map(it => {
				return {
					...it,
					label: it.name
				};
			});
			this.is_selected =
				options.is_selected ||
				function(item) {
					return false;
				};
			this.renderElement();
		},
		click_item: function(event) {
			var self = this;
			var currentOrder = self.pos.get('selectedOrder');
			this.gui.close_popup();
			var item = this.list[parseInt($(event.target).data('item-index'))];
			var confirmApply = confirm('Recuerde que el descuento debe aplicarse al final. ¿Ya seleccionó todos sus productos?');
			if(confirmApply){
				currentOrder.set_global_discount(item);
			}
		}
	});
	gui.define_popup({ name: 'apply_discount', widget: GlobalDiscountPopup });

	var GlobalIncreasePopup = PopupWidget.extend({
		template: 'SelectionPopupWidget',
		show: function(options) {
			var self = this;
			options = options || {};
			this._super(options);

			this.title = 'Aplicar incremento';
			this.list = self.pos.db.pos_increase.map(it => {
				return {
					...it,
					label: it.name
				};
			});
			this.is_selected =
				options.is_selected ||
				function(item) {
					return false;
				};
			this.renderElement();
		},
		click_item: function(event) {
			var self = this;
			var currentOrder = self.pos.get('selectedOrder');
			this.gui.close_popup();
			var item = this.list[parseInt($(event.target).data('item-index'))];
			var confirmApply = confirm('Recuerde que el incremento debe aplicarse al final. ¿Ya seleccionó todos sus productos?');
			if(confirmApply){
				currentOrder.set_global_increase(item);
			}
		}
	});
	gui.define_popup({ name: 'apply_increase', widget: GlobalIncreasePopup });

});