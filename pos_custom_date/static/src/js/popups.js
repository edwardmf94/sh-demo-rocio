odoo.define('pos_custom_date.popups', function(require) {
	'use strict';
	var gui = require('point_of_sale.gui');
	var PopupWidget = require('point_of_sale.popups');

	var OutDateInfoWidget = PopupWidget.extend({
		template: 'OutDateInfoWidget',
		show: function(options){
			options = options || {};
			this._super(options);
			this.renderElement();
			if(options.data){
				var data = options.data;
				this.$('input[name=forced_date_ref]').val(data.forced_date);
			}
		},
		click_confirm: function(){
			var self = this;
			var forced_date = this.$('input[name=forced_date_ref]').val();
			var currentOrder = self.pos.get('selectedOrder');
			this.gui.close_popup();
			currentOrder.set_forced_date(forced_date);
		},
	});

	gui.define_popup({name:'forced-date-info-input', widget: OutDateInfoWidget});
});