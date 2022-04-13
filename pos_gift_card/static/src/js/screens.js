odoo.define('pos_gift_card.screens', function (require) {
	"use strict";

	
	var screens = require('point_of_sale.screens');

	screens.PaymentScreenWidget.include({
		show_popup_payment_info: function(options) {
			var self = this;
			self.gui.show_screen('products');
			this.gui.show_popup('payment-info-input',{
				data: options.data,
				validate_info: function(infos){
					this.$('input').removeClass('error');
					if(!infos.bank_name) {
						this.$('input[name=gift_voucher_ref]').addClass('error');
						this.$('input[name=gift_voucher_ref]').focus();
						return false;
					}
					return true;
				},
				confirm: function(infos){
					self.gui.show_screen('payment');
					options.confirm.call(self, infos);
					self.reset_input();
					self.render_paymentlines();
				},
				cancel: function(){
				},
			});
		},
		click_paymentmethods: function(id) {
			var self = this;
			var payment_method = this.pos.payment_methods_by_id[id];

			if (payment_method.gift_voucher) {
				this.show_popup_payment_info({
					confirm: function(infos) {
						//merge infos to new paymentline
						self.pos.get_order().add_paymentline_with_details(payment_method, infos);
					},
				});
			}
			else {
				this._super(id);
			}
		},
		click_payment_info_paymentline: function(cid){
			var self = this;
			var lines = this.pos.get_order().get_paymentlines();
			for ( var i = 0; i < lines.length; i++ ) {
				if (lines[i].cid === cid) {
					this.show_popup_payment_info({
						data: lines[i],
						confirm: function(infos) {
							//merge infos to updated paymentline
							self.pos.get_order().update_paymentline_with_details(lines[i], infos);
						},
					});
					return;
				}
			}
		},

		render_paymentlines: function() {
			var self = this;
			this._super();
			var lines = this.$('.paymentlines-container table.paymentlines');
			lines.on('click','.payment-info-button', function(){
				self.click_payment_info_paymentline($(this).data('cid'));
			});
		}

	});

});