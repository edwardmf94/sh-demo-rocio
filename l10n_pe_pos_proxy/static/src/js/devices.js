odoo.define('l10n_pe_pos_proxy.devices', function(require) {
    'use strict';

    var Session = require('web.Session');

    var devices = require('point_of_sale.devices');
    devices.ProxyDevice.include({
        save_order_proxy: function(data){
            var self = this;
            return new Promise(function(resolve,reject){
                var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
                connection.rpc('/hw_proxy/account.invoice/', data, { timeout: 60000 })
                .then(
                    function(response) {
                        resolve(response);
                    },
                    function(error) {
                        reject(error);
                    }
                );
            });
        }
    });

});