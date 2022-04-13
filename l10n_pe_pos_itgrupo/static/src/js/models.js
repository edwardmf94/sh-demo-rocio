odoo.define('l10n_pe_pos_itgrupo.models', function (require) {
"use strict";

var models = require('point_of_sale.models');
var rpc = require('web.rpc');

var models_cache = models.PosModel.prototype.models;

models_cache.push({
	model: 'einvoice.catalog.01',
	fields: ['code', 'display_name'],
	domain: [],
	loaded: function(self,documents){
		self.itgrupo_catalog = documents;
	},
});

models_cache.push({
	model: 'it.invoice.serie',
	fields: ['display_name', 'document_type_id', 'sequence_id'],
	domain: function(self){
		return [['id','in',self.config.itserie_ids]];
	},
	loaded: function(self,documents){
		self.itgrupo_series = documents;
	},
});

models_cache.push({
	model: 'ir.sequence',
	fields: ['prefix', 'padding', 'number_next_actual', 'name', 'number_increment'],
	domain: function(self){
		return [['id','in',self.itgrupo_series.map(function(it){
			return it.sequence_id[0];
		})]]
	},
	loaded: function(self,journals){
		self.itgrupo_sequence = journals;
        var j_ids = [];
        _(self.itgrupo_series).each(function (it) {
            j_ids.push(it.id);
        });
        rpc.query({
            model: 'ir.sequence',
            method: 'load_pos_real_sequences',
            args: [{ sequence_ids: j_ids }],
        }).then(function (response) {
            if (response != null) {
                if (response.length > 0) {
                    for (var i = 0; i < response.length; i++) {
                        for (var s = 0; s < journals.length; s++) {
                            if (journals[s].id == response[i].sequence_id){
                                var resmax = response[i].max;
                                if (resmax == null){
                                    resmax = 0;
                                }
                                if (resmax.length>1){
                                    resmax = resmax.split('-')[1];
                                }
                                journals[s].number_next_actual = Math.max(journals[s].number_next_actual, resmax*1+1);
                            }
                        }
                    }
                }
            }
            var pending_orders = self.db.get_orders();
            if (pending_orders.length > 0) {
                for (var i = 0; i < pending_orders.length; i++) {
                    if (pending_orders[i].data.offline_invoice_number_int && pending_orders[i].data.sale_journal) {
                        if (pending_orders[i].data.sale_journal) {
                            for (var s = 0; s < journals.length; s++) {
                                if (journals[s].id == pending_orders[i].data.sale_journal){
                                    journals[s].number_next_actual = Math.max(journals[s].number_next_actual, pending_orders[i].data.offline_invoice_number_int+1);
                                }
                            }
                        }
                    }
                }
            }
            self.itgrupo_sequence = journals;
            //console.log(journals);
        })
	},
});


var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
	export_as_JSON: function() {
		var json = _super_order.export_as_JSON.apply(this, arguments);
		json.sale_journal = this.get_sale_journalit()
			? this.get_sale_journalit()
			: false;
		json.type_document_id = this.get_document_type_id()
			? this.get_document_type_id()
			: false;
		return json;
	},
	export_for_printing: function() {
		var json = _super_order.export_for_printing.apply(this, arguments);
		json.sale_journal = this.get_sale_journalit();
		return json;
	},
	get_sale_journalit: function() {
		return this.sale_journal;
	},
	set_sale_journalit: function(journal){
		this.assert_editable();
		this.sale_journal = journal;
		if(!journal) this.to_invoice = false;
		else this.to_invoice = true;
		this.save_to_db();
	},
    get_sequence: function(){
        var sequence_id = this.get_sale_journalit();
        var itserie = this.pos.itgrupo_series.find(function(item){
            return item.id == sequence_id;
        });
        var sequence = this.pos.itgrupo_sequence.find(function(item){
            return item.id == itserie.sequence_id[0];
        });
        return sequence;
    },
    generate_sequence: function(){
        function zero_pad(num, size) {
            var s = '' + num;
            while (s.length < size) {
                s = '0' + s;
            }
            return s;
        }
        var sequence = this.get_sequence();
        if (sequence){
            var formatting = '';
            if (sequence.prefix)
                formatting += sequence.prefix;
            if (sequence.number_next_actual)
                formatting += zero_pad(
                    sequence.number_next_actual,
                    sequence.padding
                );
            this.set_offline_invoice_number(formatting);
            this.set_offline_invoice_number_int(sequence.number_next_actual);
            var sposition = this.pos.itgrupo_sequence.findIndex(item => item.id == sequence.id);
            this.pos.itgrupo_sequence[sposition].number_next_actual += sequence.number_increment;
        }
    },
    get_document_type: function(){
        var serie = this.get_sale_journalit();
        var document_type = {};
        var itserie = this.pos.itgrupo_series.find(function(item){
            return item.id == serie;
        });
        var document_type = this.pos.itgrupo_catalog.find(function(item){
            return item.id == itserie.document_type_id[0];
        });
        return document_type;
    },
    get_document_type_id: function(){
        var serie = this.get_sale_journalit();
        if(!serie){
        	return false;
        }
        var document_type = {};
        var itserie = this.pos.itgrupo_series.find(function(item){
            return item.id == serie;
        });
        var document_type = this.pos.itgrupo_catalog.find(function(item){
            return item.id == itserie.document_type_id[0];
        });
        return document_type.id;
    },
    select_document_type: function(partner){
        var self = this;
        if(partner){
            var reniec_type = self.pos.documents_sunat.find(function(item){
                return item.id == partner.l10n_latam_identification_type_id[0];
            });
            var document_type = false;
            if(reniec_type.l10n_pe_vat_code=='6'){
                document_type = this.pos.itgrupo_catalog.find(function(item){
                    return item.code == '01';
                });
            }else{
                document_type = this.pos.itgrupo_catalog.find(function(item){
                    return item.code == '03';
                });
            }
            if(document_type){
                var itserie = this.pos.itgrupo_series.find(function(item){
                    return item.document_type_id[0] == document_type.id;
                });
                var currentJournal = self.get_sale_journalit();
                self.set_sale_journalit(itserie.id);
                $('.js_journalit').removeClass('highlight');
                $('.js_journalit[data-journal='+itserie.id+']').addClass('highlight');
            }
        }
    }
});

});