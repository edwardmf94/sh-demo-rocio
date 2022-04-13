odoo.define('l10n_pe_pos.popups', function (require) {
	'use strict';
	var gui = require('point_of_sale.gui');
	var PopupWidget = require('point_of_sale.popups');

	var CreditNotePopupWidget = PopupWidget.extend({
		template: 'CreditNotePopup',
		show: function (options) {
			var self = this;
			options = options || {};
			this._super(options);
			this.renderElement();
			self.$el.find('[name=origin]').val(options.origin);
			var $cbo = self.$el.find('[name=credit_note_type]');
            var credit_types = [
                ['01','Anulación de la Operación'],
                ['02','Anulación por error en el RUC'],
                ['03','Corrección por error en la descripción'],
                ['04','Descuento Global'],
                ['05','Descuento por item'],
                ['06','Devolución total'],
                ['07','Devolución por item'],
                ['08','Bonificación'],
                ['09','Disminución en el valor'],
                ['10','Otros conceptos'],
            ];
			credit_types.forEach(function (item) {
				$cbo.append('<option value="' + item[0] + '">' + item[1] + '</option>');
			});
		},
		events: {
			'click .button_ok': 'clickOk',
			'click .button_close': 'clickHide'
		},
		clickHide: function () {
			this.pos.gui.close_popup();
		},
		clickOk: function () {
			var self = this;
			var credit_note_type = self.$el.find('[name=credit_note_type]').val();
			var credit_note_reason = self.$el.find('[name=credit_note_reason]').val();
			if (credit_note_type === '') {
				return alert('Debe seleccionar un tipo de nota de credito.')
			}
			self.options.cb(credit_note_type, credit_note_reason);
			this.pos.gui.close_popup();
		}
	});

	gui.define_popup({ name: 'credit_note', widget: CreditNotePopupWidget });

	return {
		CreditNotePopupWidget: CreditNotePopupWidget
	}

});