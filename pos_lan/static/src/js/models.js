odoo.define('pos_lan.models', function(require) {
	'use strict';

	var models = require('point_of_sale.models');
	var rpc = require('web.rpc');
	var Session = require('web.Session');

	var firstTime = true;

	var posmodel_super = models.PosModel.prototype;
	models.PosModel = models.PosModel.extend({
		load_server_data: function () {
			var self = this;
			return posmodel_super.load_server_data.apply(this, arguments).then(function () {
				var employee_ids = _.map(self.employees, function(employee){return employee.id;});
				var records = rpc.query({
					model: 'hr.employee',
					method: 'get_barcodes_and_pin_hashed',
					args: [employee_ids],
				});
				return records.then(function (employee_data) {
					self.employees.forEach(function (employee) {
						var data = _.findWhere(employee_data, {'id': employee.id});
						if (data !== undefined){
							employee.barcode = data.barcode;
							employee.pos_cashier = data.pos_cashier;
							employee.pin = data.pin;
						}
					});
				});
			});
		},
		on_removed_order: function(removed_order,index,reason){
			posmodel_super.on_removed_order.apply(this, arguments);
			if(this.config.pos_lan_hr_select){
				this.gui.show_screen('login');
			}
		},
		add_new_order: function(){
			posmodel_super.add_new_order.apply(this, arguments);
			if(this.config.pos_lan_hr_select){
				if(!firstTime) {
					this.gui.show_screen('login');
				}else{
					firstTime = false;
				}
			}
		},
		set_order: function(order){
			posmodel_super.set_order.apply(this, arguments);
			if(this.config.pos_lan_hr_select){
				this.gui.show_screen('login');
			}
		}
	});

	var _super_order = models.Order.prototype;
	models.Order = models.Order.extend({
		initialize: function() {
			_super_order.initialize.apply(this, arguments);
			this.lan_id = this.lan_id || this.get_lan_id() || false;
			this.seller_id = this.seller_id || this.pos.get_cashier().id || false;
			this.save_to_db();
		},
		init_from_JSON: function(json) {
			var self = this;
			_super_order.init_from_JSON.apply(this, arguments);
			this.seller_id = json.seller_id || false;
			this.lan_id = json.lan_id || false;
		},
		export_as_JSON: function() {
			var json = _super_order.export_as_JSON.apply(this, arguments);
			json.seller_id = this.get_seller_id()
				? this.get_seller_id()
				: this.pos.get_cashier().id;
			json.lan_id = this.get_lan_id()
				? this.get_lan_id()
				: false;
			return json;
		},
		export_for_printing: function() {
			var json = _super_order.export_for_printing.apply(this, arguments);
			json.seller_id = this.get_seller_name();
			return json;
		},
		set_seller_id: function(seller_id) {
			this.assert_editable();
			this.seller_id = seller_id;
		},
		get_seller_id: function() {
			return this.seller_id;
		},
		set_lan_id: function(lan_id) {
			this.assert_editable();
			this.lan_id = lan_id;
		},
		get_lan_id: function() {
			return this.lan_id;
		},
		get_seller_name: function() {
			var seller_id = this.seller_id;
			var employee = this.pos.employees.find(function(it){
				return it.id==seller_id;
			});
			if(employee){
				return employee.name;
			}
			return '--';
		},
		get_cashier_name: function() {
			var cashier_id = this.pos.pos_session.user_id[0];
			var user = this.pos.users.find(function(it){
				return it.id==cashier_id;
			});
			if(user){
				return user.name;
			}
			return '--';
		},
		initialize_validation_date: function(){
			var self = this;
			_super_order.initialize_validation_date.apply(this, arguments);
			if(self.pos.config.pos_lan_delete){
				var tempId = this.get_lan_id();
				if(tempId){
					var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
					connection.rpc('/hw_local/delete', {
						id: tempId
					}, { timeout: 7500 })
					.catch(function(err){
						console.error('[proxy get]',err);
						self.pos.gui.show_popup('error', {
							message: _t('Connection error'),
							comment: _t(
								'Can not execute this action because the POS is currently offline'
							)
						});
					});
				}
			}
		}
	});

});