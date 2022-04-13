odoo.define('l10n_pe_pos.models', function (require) {
"use strict";
var models = require('point_of_sale.models');

models.load_fields('res.partner', ['l10n_latam_identification_type_id']);
models.load_fields('res.company', ['street']);
models.load_fields("res.partner", "state_contributor_sunat");
models.load_fields("res.partner", "condition_contributor_sunat");
const array_ruc = ['10', '15', '17', '20'];

var models_cache = models.PosModel.prototype.models;
var document_sunat_index = models_cache.findIndex(document_sunat => document.model == "l10n_latam.identification.type");

if(document_sunat_index == -1){
	models_cache.push({
		model: 'l10n_latam.identification.type',
		fields: ['l10n_pe_vat_code', 'name'],
		domain: [['active','=',true]],
		loaded: function(self,documents_sunat){
			self.documents_sunat = documents_sunat;
		},
	});
}

models_cache.push({
	model: 'l10n_latam.document.type',
	fields: ['code', 'name', 'doc_code_prefix'],
	domain: [['active','=',true]],
	loaded: function(self,documents){
		self.documents_sale = documents;
	},
});

models_cache.push({
	model: 'account.journal',
	fields: ['l10n_pe_sequence_ids', 'name'],
	domain: function(self){
		return [['id','=',self.config.invoice_journal_id[0]]]
	},
	loaded: function(self,journal){
		if (journal.length > 0) {
			self.journal_sale_ids = journal[0].l10n_pe_sequence_ids;
		} else {
			self.journal_sale_ids = []
		}
	},
});

models_cache.push({
	model: 'ir.sequence',
	fields: ['prefix', 'l10n_latam_document_type_id', 'padding', 'number_next_actual', 'name', 'number_increment'],
	domain: function(self){
		return [['active','=',true],['id','in',self.journal_sale_ids]]
	},
	loaded: function(self,journals){
		self.journal_sale_ids = journals;
	},
});

models_cache.push({
	model: 'account.payment.term',
	fields: ['id', 'name', 'line_ids'],
	domain: function(self){
		return [['active','=',true]]
	},
	loaded: function(self,payment_terms){
		self.payment_term_ids = payment_terms;
		self.db.add_payment_terms(payment_terms);
	},
});

models_cache.push({
	model: 'account.payment.term.line',
	fields: ['id', 'days', 'payment_id'],
	domain: function(self){
		return []
	},
	loaded: function(self,payment_term_lines){
		self.payment_term_line_ids = payment_term_lines;
		self.db.add_payment_term_lines(payment_term_lines);
	},
});

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
	initialize: function() {
		_super_order.initialize.apply(this, arguments);
		this.sale_journal = this.sale_journal || false;
		this.refund_invoice_id = this.refund_invoice_id || false;
		this.is_credit_note = this.is_credit_note || false;
		this.credit_note_type = this.credit_note_type || false;
		if (this.pos.config.default_partner_id) {
			this.set_client(this.pos.db.get_partner_by_id(this.pos.config.default_partner_id[0]));
		}
		if (this.pos.config.cash_payment_term_id) {
			this.set_payment_term_id(this.pos.config.cash_payment_term_id[0]);
		}
		this.save_to_db();
	},
	init_from_JSON: function(json) {
		var self = this;
		_super_order.init_from_JSON.apply(this, arguments);
		if(json.sale_journal){
			self.sale_journal = json.sale_journal;
			self.to_invoice = true;
		}
		if (json.is_credit_note) {
			self.set_refund_id(json.refund_invoice_id);
			self.set_credit_note_type(json.credit_note_type);
			self.set_credit_note_origin(json.origin);
			self.set_credit_note_origin_type(json.credit_note_origin_type);
			self.set_credit_note(json.is_credit_note);
		}
	},
	export_as_JSON: function() {
		var json = _super_order.export_as_JSON.apply(this, arguments);
		json.sale_journal = this.get_sale_journal()
			? this.get_sale_journal()
			: false;
		json.is_credit_note = this.get_credit_note() ? this.get_credit_note() : false;
		json.refund_invoice_id = this.get_refund_id() ? this.get_refund_id() : false;
		json.credit_note_type = this.get_credit_note_type() ? this.get_credit_note_type() : false;
		json.origin = this.get_credit_note_origin() ? this.get_credit_note_origin() : false;
		json.credit_note_origin_type = this.get_credit_note_origin_type() ? this.get_credit_note_origin_type() : false;
		return json;
	},
	export_for_printing: function() {
		var json = _super_order.export_for_printing.apply(this, arguments);
		json.sale_journal = this.get_sale_journal();
		json.is_credit_note = this.get_credit_note();
		json.credit_note_type = this.get_credit_note_type();
		json.origin = this.get_credit_note_origin();
		return json;
	},
	get_sale_journal: function() {
		return this.sale_journal;
	},
	set_sale_journal: function(journal){
		this.assert_editable();
		this.sale_journal = journal;
		if(!journal) this.to_invoice = false;
		else this.to_invoice = true;
		this.save_to_db();
	},
	get_payment_term_id: function() {
		return this.payment_term_id;
	},
	get_payment_term: function() {
		var self = this;
		var payment_term = 'CONTADO';
		if(this.payment_term_id){
			payment_term = this.pos.payment_term_ids.find(function(item){
				return item.id==self.payment_term_id;
			});
			if(payment_term) payment_term = payment_term.name;
		}
		return payment_term;
	},
	set_payment_term_id: function(payment_term){
		this.assert_editable();
		this.payment_term_id = payment_term;
		this.save_to_db();
	},
	set_refund_id: function (refund_id) {
		this.refund_invoice_id = refund_id;
		this.save_to_db();
	},
	get_refund_id: function () {
		return this.refund_invoice_id;
	},
	set_credit_note_type: function (credit_note_type) {
		this.credit_note_type = credit_note_type;
		this.save_to_db();
	},
	get_credit_note_type: function () {
		return this.credit_note_type;
	},
	get_credit_note_type_name: function () {
		var self = this;
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
			if (item[0] == self.credit_note_type){
				return item[1]
			}
		});
		return credit_types[0][1];
	},
	set_credit_note_origin: function (credit_note_origin) {
		this.origin = credit_note_origin;
		this.save_to_db();
	},
	get_credit_note_origin: function () {
		return this.origin;
	},
	set_credit_note_origin_type: function (credit_note_origin_type) {
		this.credit_note_origin_type = credit_note_origin_type;
		this.save_to_db();
	},
	get_credit_note_origin_type: function () {
		return this.credit_note_origin_type;
	},
	set_credit_note: function (is_credit_note) {
		this.is_credit_note = is_credit_note;
		this.save_to_db();
	},
	get_credit_note: function () {
		return this.is_credit_note;
	},
	/**
	Esta funcion se utiliza para la impresion de notas de credito (no debe salir en negativo)
	*/
	get_total_with_tax_credit: function () {
		return parseFloat(-this.get_total_with_tax());
	},
	set_client: function(partner){
		_super_order.set_client.apply(this, arguments);
		if(partner){
			this.select_document_type(partner);
		}
		/*if(partner.property_payment_term_id&&this.set_payment_term_id!=undefined){
			this.set_payment_term_id(partner.property_payment_term_id[0]);
		}*/
	},
	select_document_type: function(partner){
		var self = this;
		var reniec_type = self.pos.documents_sunat.find(function(item){
			if(partner.l10n_latam_identification_type_id)
				return item.id == partner.l10n_latam_identification_type_id[0];
			else return false;
		});
		var document_type = false;
		if(reniec_type.l10n_pe_vat_code=='6'){
			document_type = this.pos.documents_sale.find(function(item){
				return item.code == '01';
			});
		}else{
			document_type = this.pos.documents_sale.find(function(item){
				return item.code == '03';
			});
		}
		$('.js_journal').removeClass('highlight');
		self.set_sale_journal(false);
		self.set_to_invoice(false);
		if(document_type){
			if (this.pos.journal_sale_ids.length>0){
				var serie = this.pos.journal_sale_ids.find(function(item){
					return item.l10n_latam_document_type_id[0] == document_type.id;
				});
				var currentJournal = self.get_sale_journal();
				self.set_to_invoice(true);
				self.set_sale_journal(serie.id);
				$('.js_journal[data-journal='+serie.id+']').addClass('highlight');
			}
		}
	}
});

var _super_orderline = models.Orderline.prototype;
models.Orderline = models.Orderline.extend({
	/**
	Esta funcion se utiliza para la impresion de notas de credito (no debe salir en negativo)
	*/
	get_quantity_credit: function () {
		return parseFloat(-this.quantity).toFixed(3);
	},
	get_display_price_credit: function () {
		return parseFloat(-this.get_display_price());
	},
});

});