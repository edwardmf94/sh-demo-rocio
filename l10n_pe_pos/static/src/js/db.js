odoo.define('l10n_pe_pos.DB', function (require) {
	"use strict";
	
	var DB = require('point_of_sale.DB');

	DB.include({
		add_payment_terms: function(payments){
			var payment_ids = {};
        	for(var i = 0, len = payments.length; i < len; i++){
        		var payment = payments[i];
        		payment_ids[payment.id] = payment;
        	}
        	this.payment_term_by_id = payment_ids;
		},
		get_payment_term_id: function(id){
			return this.payment_term_by_id[id];
		},
		add_payment_term_lines: function(lines){
			var payment_ids = {};
        	for(var i = 0, len = lines.length; i < len; i++){
        		var line = lines[i];
        		payment_ids[line.payment_id[0]] = line;
        	}
        	this.payment_term_line_by_id = payment_ids;
		},
		get_payment_term_line_id: function(id){
			return this.payment_term_line_by_id[id];
		},
	});

});