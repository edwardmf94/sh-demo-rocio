odoo.define('l10n_pe_pos_edi.models', function (require) {
"use strict";
var models = require('point_of_sale.models');
var rpc = require('web.rpc');
var utils = require('web.utils');
var round_pr = utils.round_precision;

models.load_fields('res.partner', ['property_payment_term_id']);
models.load_fields("account.tax", ['l10n_pe_edi_tax_code','l10n_pe_edi_igv_type']);

var models_cache = models.PosModel.prototype.models;

models_cache.push({
    model: 'ir.sequence',
    fields: ['prefix', 'l10n_latam_document_type_id', 'padding', 'number_next_actual', 'name', 'number_increment'],
    domain: function(self){
        let journal_ids = [];
        if(self.journal_sale_ids){
            journal_ids = self.journal_sale_ids.map(function(journal) {
                return journal.id
            });
        }
        return [['active','=',true],['id','in', journal_ids]]
    },
    loaded: function(self,journals){
        var j_ids = [];
        _(journals).each(function (it) {
            j_ids.push(it.id);
        });
        rpc.query({
            model: 'account.journal',
            method: 'load_real_sequences',
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
            self.journal_sale_ids = journals;
            //console.log(journals)
        })
    },
});

/*models_cache.push({
    model: 'igv.afectation.type',
    fields: ['id', 'code', 'name'],
    loaded: function(self,igv_types){
        self.igv_types = igv_types;
    },
});*/

var formatDate = function (date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    monthIndex++;
    if (monthIndex < 10) monthIndex = '0' + monthIndex;
    var year = date.getFullYear();

    return year + '-' + monthIndex + '-' + day;
}

var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({
    // wrapper around the _save_to_server that updates the synch status widget
    _flush_orders: function(orders, options) {
        var self = this;
        this.set_synch('connecting', orders.length);

        var newOrders = orders;
        var pendingOrdersLength = orders.length;
        if(pendingOrdersLength>1) newOrders = [orders[0]];

        return this._save_to_server(newOrders, options).then(function (server_ids) {
            self.set_synch('connected');

            if(pendingOrdersLength>1){
                self._flush_orders(self.db.get_orders(), options);
            }
            
            return _.pluck(server_ids, 'id');
        }).catch(function(error){
            self.set_synch(self.get('failed') ? 'error' : 'disconnected');
            return Promise.reject(error);
        });
    },
    push_and_invoice_order: function (order) {
        var self = this;
        var invoiced = new Promise(function (resolveInvoiced, rejectInvoiced) {
            if(!order.get_client()){
                rejectInvoiced({code:400, message:'Missing Customer', data:{}});
            }
            else {
                var order_id = self.db.add_order(order.export_as_JSON());

                self.flush_mutex.exec(function () {
                    var done =  new Promise(function (resolveDone, rejectDone) {
                        // send the order to the server
                        // we have a 30 seconds timeout on this push.
                        // FIXME: if the server takes more than 30 seconds to accept the order,
                        // the client will believe it wasn't successfully sent, and very bad
                        // things will happen as a duplicate will be sent next time
                        // so we must make sure the server detects and ignores duplicated orders

                        var transfer = self._flush_orders([self.db.get_order(order_id)], {timeout:30000, to_invoice:true});

                        transfer.catch(function (error) {
                            rejectInvoiced(error);
                            rejectDone();
                        });

                        transfer.then(function(order_server_id){
                            if (order_server_id.length) {
                                resolveInvoiced(order_server_id);
                                resolveDone();
                            } else {
                                rejectInvoiced({code:401, message:'Backend Invoice', data:{order: order}});
                                rejectDone();
                            }
                        });
                        return done;
                    });
                });
            }
        });
        return invoiced;
    },
});

var _super_orderline = models.Orderline.prototype;
models.Orderline = models.Orderline.extend({
    get_code_igv_type(){
        var self = this;
        var taxes = this.get_taxes()
        if (taxes.length > 0){
            /*var igv_type = self.pos.igv_types.find(function(item){
                //return item.id == taxes[0].igv_afectaction_type_id[0]
            });
            if (igv_type) return igv_type.code*/
            return taxes[0].l10n_pe_edi_igv_type;
        } 
        return false
    },
    get_uom_str: function () {
        return this.get_unit().name;
    },
    /**
    Esta funcion se utiliza para la impresion de notas de credito (no debe salir en negativo)
    */
    get_quantity_credit: function () {
        return parseFloat(-this.quantity).toFixed(3);
    },
    get_display_price_credit: function () {
        return parseFloat(-this.get_display_price());
    },
    /**
    Esta seccion incluye reemplazos para caracteres especiales
    */
    get_product_xml: function () {
        var product_name = '';
        if (this.product_name) {
            product_name = this.product_name;
        } else {
            product_name = this.get_product().display_name;
        }
        if (product_name != '') {
            product_name = product_name.split('ñ').join('n');
            product_name = product_name.split('Ñ').join('N');
        }
        return product_name;
    }
});

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
    initialize: function() {
        _super_order.initialize.apply(this, arguments);
        this.amount_text_es = new Amount2TextEs();
        this.payment_term_id = this.payment_term_id || false;
        this.offline_invoice_number = this.offline_invoice_number || false;
        this.offline_invoice_number_int = this.offline_invoice_number_int || false;
        this.save_to_db();
    },
    init_from_JSON: function(json) {
        var self = this;
        _super_order.init_from_JSON.apply(this, arguments);
        if (json.payment_term_id){
            self.payment_term_id = json.payment_term_id;
        }
    },
    export_as_JSON: function() {
        var json = _super_order.export_as_JSON.apply(this, arguments);
        json.payment_term_id = this.payment_term_id ? this.payment_term_id : false;
        json.offline_invoice_number = this.get_offline_invoice_number()
            ? this.get_offline_invoice_number()
            : false;
        json.offline_invoice_number_int = this.get_offline_invoice_number_int()
            ? this.get_offline_invoice_number_int()
            : false;
        return json;
    },
    export_for_printing: function() {
        var json = _super_order.export_for_printing.apply(this, arguments);
        json.offline_invoice_number = this.get_offline_invoice_number();
        json.offline_invoice_number_int = this.get_offline_invoice_number_int();
        return json;
    },
    get_sequence: function(){
        var sequence_id = this.get_sale_journal();
        var sequence = this.pos.journal_sale_ids.find(function(item){
            return item.id == sequence_id;
        });
        return sequence;
    },
    get_document_type: function(){
        var sequence = this.get_sequence();
        var document_type = {};
        if (sequence){
            document_type = this.pos.documents_sale.find(function(item){
                return item.id == sequence.l10n_latam_document_type_id[0];
            });
        }
        return document_type;
    },
    get_client_document_type: function(){
        var client = this.get_client();
        var client_document_type = this.pos.documents_sunat.find(function(item){
            return item.id == client.l10n_latam_identification_type_id[0];
        });
        return client_document_type;
    },
    get_offline_invoice_number: function () {
        return this.offline_invoice_number;
    },
    set_offline_invoice_number: function (number) {
        this.offline_invoice_number = number;
    },
    get_offline_invoice_number_int: function () {
        return this.offline_invoice_number_int;
    },
    set_offline_invoice_number_int: function (number) {
        this.offline_invoice_number_int = number;
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
            var sposition = this.pos.journal_sale_ids.findIndex(item => item.id == sequence.id);
            this.pos.journal_sale_ids[sposition].number_next_actual += sequence.number_increment;
        }
    },
    get_date_due: function () {
        var self = this;
        var payment_term = this.pos.payment_term_ids.find(function (item) {
            return item.id == self.payment_term_id;
        });
        var line = this.pos.db.get_payment_term_line_id(self.payment_term_id);
        console.log('SOSPECHO',payment_term,line);
        //FIX: calcular fecha
        if (payment_term) {
            return moment().add(-5, 'hours').add(line.days, 'days').format('DD/MM/YYYY');
        } else {
            return moment().add(-5, 'hours').format('DD/MM/YYYY');
        }
    },
    get_total_without_tax: function() {
        return round_pr(this.orderlines.reduce((function(sum, orderLine) {
            if (orderLine.get_code_igv_type() == '10') {
                return sum + orderLine.get_price_without_tax();
            } else {
                if(orderLine.get_code_igv_type()==false){
                    return sum + orderLine.get_price_without_tax();
                }else{
                    return sum;
                }
            }
        }), 0), this.pos.currency.rounding);
    },
    get_total_exonerated: function () {
        var self = this;
        return round_pr(
            this.orderlines.reduce(function (sum, orderLine) {
                if (orderLine.get_tax() == 0 && orderLine.get_code_igv_type() == '20') {
                    return sum + orderLine.get_display_price();
                } else {
                    return sum;
                }
            }, 0),
            this.pos.currency.rounding
        );
    },
    get_total_innafected: function () {
        var self = this;
        return round_pr(
            this.orderlines.reduce(function (sum, orderLine) {
                if (orderLine.get_tax() == 0 && orderLine.get_code_igv_type() == '30') {
                    return sum + orderLine.get_display_price();
                } else {
                    return sum;
                }
            }, 0),
            this.pos.currency.rounding
        );
    },
    get_total_gift: function () {
        return round_pr(
            this.orderlines.reduce(function (sum, orderLine) {
                if (orderLine.get_code_igv_type() == '15') {
                    return sum + orderLine.price;
                } else {
                    return sum;
                }
            }, 0),
            this.pos.currency.rounding
        );
    },
    get_total_perception: function(){
        var tax_details = this.get_tax_details()
        if (tax_details.length>0){
            return tax_details.reduce(function(sum, e){
                if (e.name=='Percepcion 2%'){
                    return sum + e.amount;
                }else{
                    return sum;
                }
            }, 0);
        }else{
            return 0;
        }
    },
    get_total_with_tax: function () {
        return (
            this.get_total_without_tax() +
            this.get_total_tax() +
            this.get_total_exonerated() +
            this.get_total_innafected()
        );
    },
    get_total_without_perception: function(){
        return (this.get_total_with_tax()-this.get_total_perception())
    },
    get_total_with_perception: function(){
        return (this.get_total_with_tax())
    },
    getTotalItems: function(){
        return this.orderlines.length || 0;
    },
    get_qr: function (data) {
        var res = []
        res.push(this.pos.company.vat || '');
        res.push(this.get_document_type().code);
        if (this.offline_invoice_number) res.push(this.offline_invoice_number.split('-').join('|') || '');
        else res.push('')
        res.push(this.get_total_tax() || '');
        res.push(this.get_total_with_tax() || '');
        res.push(formatDate(new Date()));
        res.push(this.get_client_document_type().l10n_pe_vat_code || '-');
        res.push(this.get_client().vat || '-');
        var qr_string = res.join('|');
        return qr_string;
    },
    getAmountText: function () {
        //currency_code=this.pos.config.sunat_currency_code;
        var currency_code = 'PEN';
        var res = '';
        if (currency_code == 'PEN') {
            res = this.amount_text_es.numeroALetras(Math.abs(this.get_total_with_tax()), '', '');
        }
        else {
            res = this.amount_text_es.numeroALetras(Math.abs(this.get_total_with_tax()), currency_code, currency_code);
        }
        return res.toUpperCase();
    },
    getCantText: function (cant) {
        //currency_code=this.pos.config.sunat_currency_code;
        var currency_code = 'PEN';
        var res = '';
        if (currency_code == 'PEN') {
            res = this.amount_text_es.numeroALetras(Math.abs(cant), '', '');
        }
        else {
            res = this.amount_text_es.numeroALetras(Math.abs(cant), currency_code, currency_code);
        }
        return res.toUpperCase();
    },
    /**
    Esta seccion incluye reemplazos para caracteres especiales
    */
    get_client_name_xml: function () {
        var client_name = this.get_client_name();
        if (client_name != '') {
            client_name = client_name.split('ñ').join('n');
            client_name = client_name.split('Ñ').join('N');
        }
        return client_name;
    },
});

});