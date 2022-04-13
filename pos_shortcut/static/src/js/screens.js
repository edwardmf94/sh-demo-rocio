odoo.define('pos_shortcut.screens', function(require) {
	'use strict';

	var gui = require('point_of_sale.gui');
	var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');
	var session = require('web.session');
	var core = require('web.core');
	var rpc = require('web.rpc');
	var PopupWidget = require('point_of_sale.popups');

	var QWeb = core.qweb;
	var _t = core._t;

	var _super_posmodel = models.PosModel.prototype;

	/* customizing product screen widget for shortcut */
	var ShortcutTipsWidget = PopupWidget.extend({
		template: 'ShortcutTipsWidget',
	});
	gui.define_popup({name: 'shortcuttips', widget: ShortcutTipsWidget});

	screens.ProductScreenWidget.include({
		init: function(parent, options){
			this._super(parent,options);

			var self = this;

			this.actionpad = new screens.ActionpadWidget(this,{});
			this.actionpad.replace(this.$('.placeholder-ActionpadWidget'));

			this.numpad = new screens.NumpadWidget(this,{});
			this.numpad.replace(this.$('.placeholder-NumpadWidget'));

			this.product_screen_keydown_event_handler = function(event){
				/* product screen key down events */
				if(!$($(document).find(".product-screen")[0]).hasClass('oe_hidden')){
					if(event.which == 113) {      // click on "F2" button
						$('[name=shortcut_tips_btn]').trigger("click");
					}
					if(event.which == 40 && $(document).find("input,textarea").is(":focus")) {
						event.preventDefault();
						var $selected = $('.product-list-container .product-list tbody tr.selected:eq(0)');
						if($selected.length>0){
							/*var product = self.pos.db.get_product_by_id($selected.attr('data-product-id'));
							self.pos.get('selectedOrder').add_product(product);
							return $selected.removeClass('selected');*/
						}else{
							$('.product-list-container .product-list tbody tr:eq(0)').addClass('selected');
							if($(document).find("input").is(":focus")){
								return $(document).find(".searchbox input").blur();
							}
						}
					}
					if(event.shiftKey && event.which == 79){
						self.actionpad.gui.show_screen('local_order_list_screen');
					}
				}

				if(!$(document).find("input,textarea").is(":focus") && !$($(document).find(".product-screen")[0]).hasClass('oe_hidden') && $($(document).find("div.popup.popup-number.popup-password")[0]).parent().hasClass('oe_hidden')){
					if(event.which == 81){  // click on "q" button
						self.numpad.state.changeMode('quantity');
					} else if(event.which == 68){   // click on "d" button
						var cashier = self.pos.get('cashier') || self.pos.get_cashier();
						var has_price_control_rights = !self.pos.config.restrict_discount_control || cashier.role == 'manager';
						if(has_price_control_rights)
							self.numpad.state.changeMode('discount');
					} else if(event.which == 80){   // click on "p" button
						var cashier = self.pos.get('cashier') || self.pos.get_cashier();
						var has_price_control_rights = !self.pos.config.restrict_price_control || cashier.role == 'manager';
						if(has_price_control_rights)
							self.numpad.state.changeMode('price');
					} else if(event.which == 8){    // click on "Backspace" button
						self.numpad.state.deleteLastChar();
					} else if(event.which >= 96 && event.which <= 105) {    // click on numpad 1-9 and 0 button
						var newChar = String.fromCharCode(event.which - 48 );
						//self.numpad.state.appendNewChar(newChar);
					} else if(event.which == 109) {     // click on numpad "-" button
						self.numpad.state.switchSign();
					} else if(event.which == 110) {     // click on numpad "." button
						self.numpad.state.appendNewChar('.');
					} else if(event.which == 67) {      // click on "c" button
						self.actionpad.gui.show_screen('clientlist');
					} else if(event.which == 32) {      // click on "space" button
						if(self.pos.config.cashier_mode){
							var user = self.pos.get_cashier();
							if(user.pos_cashier){
								//self.actionpad.gui.show_screen('payment');
								$('.product-screen .actionpad button.button.pay').click();
							}else{
								$('.product-screen .leftpane button.button:nth-child(2)').click();
							}
						}else{
							$('.product-screen .actionpad button.button.pay').click();
							//self.actionpad.gui.show_screen('payment');
						}
					} else if(event.which == 46) {      // click on "Delete" button
						self.pos.get_order().remove_orderline(self.pos.get_order().get_selected_orderline());
					} else if(event.which == 38) {      // click on "up arrow" button
						var $selected = $('.product-list-container .product-list tbody tr.selected');
						if($selected.length==0){
							$(document).find("div.product-screen ul.orderlines li.selected").prev('li.orderline').trigger('click');
						}else{
							$selected.prev().addClass('selected');
							$selected.removeClass('selected');
						}
					} else if(event.which == 40) {      // click on "down arrow" button
						var $selected = $('.product-list-container .product-list tbody tr.selected');
						if($selected.length==0){
							$(document).find("div.product-screen ul.orderlines li.selected").next('li.orderline').trigger('click');
						}else{
							$selected.next().addClass('selected');
							$selected.removeClass('selected');
						}
					} else if(event.which == 83) {      // click on "s" button
						$(document).find("div.product-screen div.rightpane div.searchbox input").focus();
						event.preventDefault();
					} else if(event.which == 13) {
						event.preventDefault();
						if(!$($(document).find("div.popup.popup-number.popup-password")[0]).parent().hasClass('oe_hidden')){
							$($(document).find("div.popup.popup-number.popup-password")[0]).find("div.footer div.confirm").trigger("click");
						}else{
							$(document).find("input").blur();
							var $selected = $('.product-list-container .product-list tbody tr.selected:eq(0)');
							if($selected.length>0){
								var product = self.pos.db.get_product_by_id($selected.attr('data-product-id'));
								self.pos.get('selectedOrder').add_product(product);
								return $selected.removeClass('selected');
							}else{
								//return $('.product-list-container .product-list tbody tr:eq(0)').addClass('selected');
								return;
							}
						}
					}
				}

				/* payment screen key down events */
				if(!$($(document).find("div.payment-screen")[0]).hasClass('oe_hidden')){
					if (event.which == 27) {     // click on "Esc" button
						$($(document).find("div.payment-screen")[0]).find("div.top-content span.back").trigger('click');
					} else if(event.which == 67) {             // click on "c" button
						$($(document).find("div.payment-screen")[0]).find("div.js_set_customer").trigger('click');
					/*} else if (event.which == 73) {     // click on "i" button
						$($(document).find("div.payment-screen")[0]).find("div.payment-buttons div.js_invoice").trigger('click');*/
					} else if(event.which == 38) {      // click on "Page Up" button
						if($($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.highlight").length > 0){
							var elem = $($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.highlight");
							elem.removeClass("highlight");
							elem.prev("div.paymentmethod").addClass("highlight");
						}else{
							var payMethodLength = $($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.paymentmethod").length;
							if(payMethodLength > 0){
								$($($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.paymentmethod")[payMethodLength-1]).addClass('highlight');
							}
						}
					} else if(event.which == 40) {      // click on "Page Down" button
						if($($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.highlight").length > 0){
							var elem = $($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.highlight");
							elem.removeClass("highlight");
							elem.next("div.paymentmethod").addClass("highlight");
						}else{
							var payMethodLength = $($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.paymentmethod").length;
							if(payMethodLength > 0){
								$($($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.paymentmethod")[0]).addClass('highlight');
							}
						}
					} else if(event.which == 32) {      // click on "space" button
						event.preventDefault();
						$($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.highlight").trigger("click");
						$($(document).find("div.payment-screen")[0]).find("div.paymentmethods div.paymentmethod").removeClass("highlight");
					} else if(event.which == 33) {      // click on "Arrow Up" button
						if($($(document).find("div.payment-screen")[0]).find("table.paymentlines tbody tr.selected").length > 0){
							$($(document).find("div.payment-screen")[0]).find("table.paymentlines tbody tr.selected").prev("tr.paymentline").trigger("click");
						}else{
							var payLineLength = $($(document).find("div.payment-screen")[0]).find("table.paymentlines tbody tr.paymentline").length;
							if(payLineLength > 0){
								$($($(document).find("div.payment-screen")[0]).find("table.paymentlines tbody tr.paymentline")[payLineLength-1]).trigger('click');
							}
						}
					} else if(event.which == 34) {      // click on "Arrow Down" button
						if($($(document).find("div.payment-screen")[0]).find("table.paymentlines tbody tr.selected").length > 0){
							var elem = $($(document).find("div.payment-screen")[0]).find("table.paymentlines tbody tr.selected").next("tr.paymentline").trigger("click");
							elem.removeClass("highlight");
							elem.next("div.paymentmethod").addClass("highlight");
						}else{
							var payLineLength = $($(document).find("div.payment-screen")[0]).find("table.paymentlines tbody tr.paymentline").length;
							if(payLineLength > 0){
								$($($(document).find("div.payment-screen")[0]).find("table.paymentlines tbody tr.paymentline")[0]).trigger('click');
							}
						}
					} else if(event.which == 46) {      // click on "Delete" button
						event.preventDefault();
						$($(document).find("div.payment-screen")[0]).find("table.paymentlines tbody tr.selected td.delete-button").trigger("click");
					}
				}

				/* clientlist screen key down events */
				if(!$($(document).find("div.clientlist-screen")[0]).hasClass('oe_hidden')){
					if (event.which == 27) {            // click on "Esc" button
						$($(document).find("div.clientlist-screen")[0]).find("span.back").trigger('click');
					} else if(event.which == 83 && !$('.clientlist-screen input').is(':focus')) {      // click on "s" button
						$(document).find("div.clientlist-screen span.searchbox input").focus();
						event.preventDefault();
					} else if(event.which == 38) {      // click on "Arrow Up" button
						if($(document).find("div.clientlist-screen table.client-list tbody.client-list-contents tr.highlight").length > 0){
							$(document).find("div.clientlist-screen table.client-list tbody.client-list-contents tr.highlight").prev("tr.client-line").click();
						}else{
							var clientLineLength = $(document).find("div.clientlist-screen table.client-list tbody.client-list-contents tr.client-line").length;
							if(clientLineLength > 0){
								$($(document).find("div.clientlist-screen table.client-list tbody.client-list-contents tr.client-line")[clientLineLength-1]).click();
							}
						}
					} else if(event.which == 40) {      // click on "Arrow Down" button
						if($(document).find("div.clientlist-screen table.client-list tbody.client-list-contents tr.highlight").length > 0){
							$(document).find("div.clientlist-screen table.client-list tbody.client-list-contents tr.highlight").next("tr.client-line").click();
						}else{
							var clientLineLength = $(document).find("div.clientlist-screen table.client-list tbody.client-list-contents tr.client-line").length;
							if(clientLineLength > 0){
								$($(document).find("div.clientlist-screen table.client-list tbody.client-list-contents tr.client-line")[0]).click();
							}
						}
					} else if(event.which == 13 && !$('.clientlist-screen input').is(':focus')) {      // click on "Enter" button
						if(!$(document).find("div.clientlist-screen section.top-content span.next").hasClass('oe_hidden')){
							$(document).find("div.clientlist-screen section.top-content span.next").click();
						}
					} else if(event.which == 107) {     // click on numpad "+" button
						$(document).find("div.clientlist-screen section.top-content span.new-customer").click();
						$(document).find("div.clientlist-screen section.full-content section.client-details input.client-name").focus();
						event.preventDefault();
					}
				}

				/* receipt screen key down events */
				if(!$($(document).find("div.receipt-screen")[0]).hasClass('oe_hidden')){
					if(event.which == 73){   // click on "i" button
						$($(document).find("div.receipt-screen")[0]).find("div.print_invoice").trigger("click");
					} else if(event.which == 82){   // click on "r" button
						$($(document).find("div.receipt-screen")[0]).find("div.print").trigger("click");
					} else if(event.which == 13){   // click on "Enter" button
						$($(document).find("div.receipt-screen")[0]).find("div.top-content span.next").trigger("click");
					}
				}

				/* locallist screen key down events */
				if($($(document).find("div.pos_order_list-screen")[0]).length>0){
					if(!$($(document).find("div.pos_order_list-screen")[0]).hasClass('oe_hidden')){
						if (event.which == 27) {            // click on "Esc" button
							$($(document).find("div.pos_order_list-screen")[0]).find("div.back").trigger('click');
						} else if(event.which == 83 && !$(document).find("div.pos_order_list-screen section.top-content.historic span.searchbox input").focus()) {      // click on "s" button
							$(document).find("div.pos_order_list-screen section.top-content.historic span.searchbox input").focus();
							event.preventDefault();
						}
					}
				}

				/* saleorder screen key down events */
				if($($(document).find("div.sale-receipt-screen")[0]).length>0){
					if(!$($(document).find("div.sale-receipt-screen")[0]).hasClass('oe_hidden')){
						if (event.which == 27) {            // click on "Esc" button
							$($(document).find("div.sale-receipt-screen")[0]).find(".back").trigger('click');
						}
					}
				}

				/* locallist screen key down events */
				if($($(document).find("div.local_order_list-screen")[0]).length>0){
					if(!$($(document).find("div.local_order_list-screen")[0]).hasClass('oe_hidden')){
						if (event.which == 27) {            // click on "Esc" button
							$($(document).find("div.local_order_list-screen")[0]).find("div.back").trigger('click');
						} else if(event.which == 83 && !$('.local_order_list-screen input').is(':focus')) {      // click on "s" button
							$(document).find("div.local_order_list-screen span.searchbox input").focus();
							event.preventDefault();
						} else if(event.which == 38) {      // click on "Arrow Up" button
							if($(document).find("div.local_order_list-screen table.invoice-list tbody.sale-orders-contents tr.highlight").length > 0){
								$(document).find("div.local_order_list-screen table.invoice-list tbody.sale-orders-contents tr.highlight").prev("tr.listview-line").click();
							}else{
								var clientLineLength = $(document).find("div.local_order_list-screen table.invoice-list tbody.sale-orders-contents tr.listview-line").length;
								if(clientLineLength > 0){
									$($(document).find("div.local_order_list-screen table.invoice-list tbody.sale-orders-contents tr.listview-line")[clientLineLength-1]).click();
								}
							}
						} else if(event.which == 40) {      // click on "Arrow Down" button
							if($(document).find("div.local_order_list-screen table.invoice-list tbody.sale-orders-contents tr.highlight").length > 0){
								$(document).find("div.local_order_list-screen table.invoice-list tbody.sale-orders-contents tr.highlight").next("tr.listview-line").click();
							}else{
								var clientLineLength = $(document).find("div.local_order_list-screen table.invoice-list tbody.sale-orders-contents tr.listview-line").length;
								if(clientLineLength > 0){
									$($(document).find("div.local_order_list-screen table.invoice-list tbody.sale-orders-contents tr.listview-line")[0]).click();
								}
							}
						} else if(event.which == 13) {      // click on "Enter" button
							var order = $(document).find("div.local_order_list-screen table.invoice-list .highlight");
							if (order.length > 0) {
								event.preventDefault();
								$(document).find("div.local_order_list-screen section.top-content [name=btnInvoice]").click();
							}
						}
					}
				}

				/* shortcut tips modal key down events */
				if(!$($(document).find("div.modal-dialog-shortcut-tips")[0]).hasClass('oe_hidden')){
					if(event.which == 27) {   // click on "Esc" button
						$($(document).find("div.modal-dialog-shortcut-tips")[0]).find("footer.footer div.cancel").trigger("click");
					}
				}

				/* shortcut tips modal key down events */
				if(!$($(document).find("div.popup.popup-number.popup-password")[0]).parent().hasClass('oe_hidden')){
					if(event.which == 27) {   // click on "Esc" button
						$($(document).find("div.popup.popup-number.popup-password")[0]).find("div.footer div.cancel").trigger("click");
					} else if (event.keyCode >= 48 && event.keyCode <= 57) { // Numbers
						$($(document).find("div.popup.popup-number.popup-password")[0])
							.find("div.popup-numpad button[data-action="+(event.keyCode-48)+"]").trigger("click");
					} else if (event.keyCode >= 96 && event.keyCode <= 105) { // Numbers
						$($(document).find("div.popup.popup-number.popup-password")[0])
							.find("div.popup-numpad button[data-action="+(event.keyCode-96)+"]").trigger("click");
					} else if(event.which == 13){   // click on "Enter" button
						$($(document).find("div.popup.popup-number.popup-password")[0]).find("div.footer div.confirm").trigger("click");
					}
				}
			};
			$(document).find("body").on('keydown', this.product_screen_keydown_event_handler);
		},
		start: function() {
			var self = this;
			this._super();
			$('[name=shortcut_tips_btn]').click(function(){
				self.gui.show_popup("shortcuttips");
			});
			$('[name=shortcut_tips_btn]').show();
		},
	});

});
