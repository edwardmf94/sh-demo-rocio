odoo.define('l10n_pe_pos_yaros.models', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    
    models.load_fields('res.partner', ['l10n_latam_identification_type_id']);
    models.load_fields('res.company', ['street']);
    models.load_fields("res.partner", "state_contributor_sunat");
    models.load_fields("res.partner", "condition_contributor_sunat");
    const array_ruc = ['10', '15', '17', '20'];
    
    var models_cache = models.PosModel.prototype.models;
    console.log('init l10n_pe_pos_yaros.models');
    
    models_cache.push({
        model: 'invoice.document.type',
        fields: ['code', 'name', 'display_name'],
        domain: function(self){
            return [['company_id','=',self.config.company_id[0]]]
        },
        loaded: function(self,documents){
            self.yaros_catalog = documents;
        },
    });
    
    models_cache.push({
        model: 'account.journal',
        fields: ['name', 'display_name','invoice_document_type_id','l10n_pe_is_dte','sequence_number_next','sequence_prefix','sequence_suffix','sequence_padding','sequence_number_increment'],
        domain: function(self){
            return [['id','in',self.config.journal_ids]]
        },
        loaded: function(self,journals){
            var pending_orders = self.db.get_orders();
            if (pending_orders.length > 0) {
                for (var i = 0; i < pending_orders.length; i++) {
                    if (pending_orders[i].data.offline_invoice_number_int && pending_orders[i].data.custom_journal_id) {
                        if (pending_orders[i].data.custom_journal_id) {
                            for (var s = 0; s < journals.length; s++) {
                                if (journals[s].id == pending_orders[i].data.custom_journal_id){
                                    journals[s].sequence_number_next = Math.max(journals[s].sequence_number_next, pending_orders[i].data.offline_invoice_number_int+1);
                                }
                            }
                        }
                    }
                }
            }
            self.yaros_series = journals;
        },
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        export_as_JSON: function() {
            var json = _super_order.export_as_JSON.apply(this, arguments);
            json.custom_journal_id = this.get_sale_journalyaros()
                ? this.get_sale_journalyaros()
                : false;
            json.sale_journal = this.get_sale_journalyaros();
            json.yaros_prefix_val = this.get_yaros_prefix_val()
                ? this.get_yaros_prefix_val()
                : false;
            json.yaros_suffix_val = this.get_yaros_suffix_val()
                ? this.get_yaros_suffix_val()
                : false;
            return json;
        },
        export_for_printing: function() {
            var json = _super_order.export_for_printing.apply(this, arguments);
            json.custom_journal_id = this.get_sale_journalyaros();
            json.yaros_prefix_val = this.get_yaros_prefix_val();
            json.yaros_suffix_val = this.get_yaros_suffix_val();
            return json;
        },
        get_sale_journalyaros: function() {
            return this.custom_journal_id;
        },
        set_sale_journalyaros: function(journal){
            this.assert_editable();
            this.custom_journal_id = journal;
            if(!journal) this.to_invoice = false;
            else this.to_invoice = true;
            this.save_to_db();
        },
        get_yaros_prefix_val: function(){
            return this.yaros_prefix_val;
        },
        set_yaros_prefix_val: function(prefix_val){
            this.yaros_prefix_val = prefix_val;
        },
        get_yaros_suffix_val: function(){
            return this.yaros_suffix_val;
        },
        set_yaros_suffix_val: function(suffix_val){
            this.yaros_suffix_val = suffix_val;
        },
        generate_sequence: function(){
            function zero_pad(num, size) {
                var s = '' + num;
                while (s.length < size) {
                    s = '0' + s;
                }
                return s;
            }
            var curent_journal_id = this.get_sale_journalyaros();
            var curent_journal = this.pos.yaros_series.find(function(item){
                return item.id == curent_journal_id;
            });
            if (curent_journal){
                var formatting = '';
                var yaros_prefix_val = '';
                var yaros_suffix_val = '';
                if (curent_journal.sequence_prefix){
                    yaros_prefix_val = curent_journal.sequence_prefix;
                    formatting += yaros_prefix_val;
                }
                if (curent_journal.sequence_number_next){
                    yaros_suffix_val = zero_pad(
                        curent_journal.sequence_number_next,
                        curent_journal.sequence_padding
                    );
                    formatting += yaros_suffix_val;
                }
                this.set_yaros_prefix_val(yaros_prefix_val);
                this.set_yaros_suffix_val(yaros_suffix_val);
                this.set_offline_invoice_number(formatting);
                this.set_offline_invoice_number_int(curent_journal.sequence_number_next);
                var sposition = this.pos.yaros_series.findIndex(item => item.id == curent_journal.id);
                this.pos.yaros_series[sposition].sequence_number_next += curent_journal.sequence_number_increment;
            }
        },
        get_document_type: function(){
            var serie = this.get_sale_journalyaros();
            var document_type = {};
            var yarosserie = this.pos.yaros_series.find(function(item){
                return item.id == serie;
            });
            var document_type = this.pos.yaros_catalog.find(function(item){
                return item.id == yarosserie.invoice_document_type_id[0];
            });
            return document_type;
        },
        get_document_type_id: function(){
            var document_type = this.get_document_type();
            if(!document_type){
                return false;
            }
            return document_type.id;
        },
        select_document_type: function(partner){
            var self = this;
            if(partner){
                $('.js_journalyaros').removeClass('highlight');
                var reniec_type = self.pos.documents_sunat.find(function(item){
                    return item.id == partner.l10n_latam_identification_type_id[0];
                });
                var document_type = false;
                if(reniec_type.l10n_pe_vat_code=='6'){
                    document_type = this.pos.yaros_catalog.find(function(item){
                        return item.code == '01';
                    });
                }else{
                    document_type = this.pos.yaros_catalog.find(function(item){
                        return item.code == '03';
                    });
                }
                if(document_type){
                    var yarosserie = this.pos.yaros_series.find(function(item){
                        return item.invoice_document_type_id[0] == document_type.id;
                    });
                    //var currentJournal = self.get_sale_journalit();
                    if (yarosserie) {
                        self.set_to_invoice(true);
                        self.set_sale_journalyaros(yarosserie.id);
                        $('.js_journalyaros').removeClass('highlight');
                        $('.js_journalyaros[data-journal='+yarosserie.id+']').addClass('highlight');
                    }
                }
            }
        }
    });
});
