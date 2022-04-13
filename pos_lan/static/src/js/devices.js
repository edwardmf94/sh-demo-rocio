odoo.define('pos_lan.devices', function(require) {
	'use strict';

	var devices = require('point_of_sale.devices');

	devices.ProxyDevice.include({
		get_local_orders: function(data){
			var self = this;
			return new Promise(function(resolve,reject){
				self.connection.rpc('/hw_local/get/', data, { timeout: 7500 })
					.then(
						function(response) {
							resolve(response);
						},
						function(error) {
							reject(error);
						}
					);
			});
		},
		save_local_order: function(data){
			var self = this;
			return new Promise(function(resolve,reject){
				self.connection.rpc('/hw_local/save/', {data: data}, { timeout: 7500 })
					.then(
						function(response) {
							resolve(response);
						},
						function(error) {
							reject(error);
						}
					);
			});
		},
		print_dispatch: function(xmlData){
			var self = this;
			return new Promise(function(resolve,reject){
				self.connection.rpc('/hw_dispatch/print/', {receipt: xmlData}, { timeout: 5000 })
					.then(
						function(response) {
							resolve(response);
						},
						function(error) {
							reject(error);
						}
					);
			});
		},
		delete_order: function(id){
			return new Promise(function(resolve,reject){
				self.connection.rpc('/hw_local/delete', {
					id: id
				}, { timeout: 7500 })
				.then(function(response){
					resolve(true);
				})
				.catch(function(err){
					console.error('[proxy get]',err);
					self.gui.show_popup('error', {
						message: _t('Connection error'),
						comment: _t(
							'Can not execute this action because the POS is currently offline'
						)
					});
					reject(err);
				});
			});
		}
	});
});