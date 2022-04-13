odoo.define('pos_gifts.popups', function (require) {
	"use strict";

	var PopupWidget = require('point_of_sale.popups');
	var gui = require('point_of_sale.gui');
	var core = require('web.core');

	var QWeb = core.qweb;
	var _t = core._t;

	var TaxesFreeWidget = PopupWidget.extend({
		template: 'TaxesFreeWidget',
		events: {
			'click .button_close': 'clickHide'
		},
		clickHide: function() {
			this.pos.gui.close_popup();
		},
		show: function(options){
			var self = this;
			this._super(options);
			this.renderElement();
			options = options || {};
			var taxes = self.pos.taxes;
			this.renderList(taxes);
		},
		on_click_tax: function(event) {
			this.$('.taxes-contents').find('.selected').removeClass('selected');
			$(event.target).closest('div').addClass('selected');
			this.click_tax();
		},
		click_tax: function(){
			var self = this;
			var currentOrder = this.pos.get('selectedOrder');
			if (currentOrder){
				var orderline = currentOrder.get_selected_orderline();
				if (!orderline) {
					self.pos.gui.show_popup('alert', {
						title: _t('Select a orderline'),
						body: _t('Required select a orderline')
					});
					return
				}
			}
			var tax = self.$el.find('.taxes-contents .selected');
			var tax_id = false;
			if (tax.length > 0) {
				tax_id = tax.data('tax-id');
			} else {
				self.gui.show_popup('alert', {
					title: _t('Select a tax'),
					body: _t('Required select a tax')
				});
				return
			}
			orderline.gift_tax_id = tax_id;
			self.pos.gui.close_popup();
		},
		renderList: function(taxes) {
			var self = this;
			var currentOrder = this.pos.get('selectedOrder');
			if (currentOrder){
				var orderline = currentOrder.get_selected_orderline();
				if (!orderline) {
					self.pos.gui.show_popup('alert', {
						title: _t('Select a orderline'),
						body: _t('Required select a orderline')
					});
					return
				}
			}
			var gift_tax_id = orderline.gift_tax_id;
			var contents = this.$el[0].querySelector('.taxes-contents');
			contents.innerHTML = '';
			for (var i = 0, len = taxes.length; i < len; i++) {
				var tax = taxes[i]
				if ( ['9996'].includes(tax.l10n_pe_edi_tax_code) && tax.type_tax_use === 'sale' ){
					var taxline_html = QWeb.render('TaxesFreeLineWidget', {
						widget: this,
						tax: tax,
					});
					var taxline = document.createElement('div');
					taxline.innerHTML = taxline_html;
					taxline = taxline.childNodes[1];
					taxline.addEventListener('click', this.on_click_tax);
					if (gift_tax_id === tax.id){
						taxline.setAttribute('class','selection-item selected');
					}
					contents.appendChild(taxline);
					$('.local-taxes-list-screen [data-tax-id='+tax.id+']').data('data',tax.name);
				}
			}
			return true;
		},
	});
	gui.define_popup({name:'TaxesFreeWidget', widget: TaxesFreeWidget});

	return PopupWidget;

});
