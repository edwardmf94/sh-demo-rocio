odoo.define('pos_print_proxy.screens', function(require) {
'use strict';

var screens = require('point_of_sale.screens');
var core = require('web.core');
var Session = require('web.Session');

var QWeb = core.qweb;

screens.ProductScreenWidget.include({
    start: function() {
        var self = this;
        this._super();
        this.$('[name=btnOpenCash]').click(function() {
            var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
            return connection.rpc('/hw_proxy/open_cash');
        });
        if(!self.pos.config.ihw_open_cashbox){
            this.$('[name=btnOpenCash]').remove();
        }
    }
});

screens.ReceiptScreenWidget.include({
    print: function(){
        var self = this;
        if(self.pos.config.ihw_proxy){
            self.print_xml();
        }else{
            this._super();
        }
    },
    print_xml: function() {
        var self = this;
        var receipt = QWeb.render('XmlReceipt', this.get_receipt_render_env());
        var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
        if(self.pos.config.ihw_open_cashbox){
            connection.rpc('/hw_proxy/open_cash');
        }
        return connection.rpc('/hw_proxy/print_xml_receipt', {
            receipt: receipt
        });
    },
});

});