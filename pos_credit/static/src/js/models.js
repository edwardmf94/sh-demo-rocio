odoo.define('pos_credit.models', function(require) {
	'use strict';

	var models = require('point_of_sale.models');

	models.load_fields('res.partner', ['credit_limit','credit']);

	var _super_order = models.Order.prototype;
	models.Order = models.Order.extend({
		initialize: function() {
			_super_order.initialize.apply(this, arguments);
			this.has_credit = this.has_credit || false;
			this.save_to_db();
		},
		init_from_JSON: function(json) {
			var self = this;
			_super_order.init_from_JSON.apply(this, arguments);
			if(json.has_credit){
				self.set_credit(json.has_credit);
			}
		},
		export_as_JSON: function() {
			var json = _super_order.export_as_JSON.apply(this, arguments);
			json.has_credit = this.get_credit() ? this.get_credit() : false;
			return json;
		},
		export_for_printing: function() {
			var json = _super_order.export_for_printing.apply(this, arguments);
			json.has_credit = this.get_credit();
			return json;
		},
		set_credit: function(credit){
			this.has_credit = credit;
			this.save_to_db();
			var $element = $('.payment-screen .left-content .paymentcredit .btn-credit');
			if(credit){
				$element.addClass('highlight');
				this.set_client_payment_term(false);
			}else{
				$element.removeClass('highlight')
				this.set_client_payment_term(true);
			}
		},
		get_credit: function(){
			return this.has_credit;
		},
		get_credit_pending: function(){
			return this.get_total_with_tax() - this.get_total_paid();
		},
		set_client_payment_term: function(cash){
			if(cash){
				if(this.set_payment_term_id!=undefined){
					if (this.pos.config.cash_payment_term_id) {
						this.set_payment_term_id(this.pos.config.cash_payment_term_id[0]);
					}
				}
			}else{
				var partner = this.get_client();
				if(partner.property_payment_term_id&&this.set_payment_term_id!=undefined){
					this.set_payment_term_id(partner.property_payment_term_id[0]);
				}
			}
		},
	});
});