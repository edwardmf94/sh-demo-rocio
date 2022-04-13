odoo.define('pos_gifts.models', function (require) {
	"use strict";

	var models = require('point_of_sale.models');
	var rpc = require('web.rpc');
	var session = require('web.session');

	models.load_fields("account.tax", ["type_tax_use","l10n_pe_edi_tax_code"]);

	var _super_orderline = models.Orderline.prototype;
	models.Orderline = models.Orderline.extend({
		initialize: function() {
			_super_orderline.initialize.apply(this, arguments);
			this.gift_tax_id = this.gift_tax_id || false;
		},
		init_from_JSON: function(json) {
			_super_orderline.init_from_JSON.apply(this, arguments);
			this.gift_tax_id = json.gift_tax_id || false;
		},
		export_as_JSON: function() {
			var json = _super_orderline.export_as_JSON.apply(this, arguments);
			json.gift_tax_id = this.gift_tax_id;
			return json;
		},
	});

	var _super_posmodel = models.PosModel.prototype;
	models.PosModel = models.PosModel.extend({
		_save_to_server: function (orders, options) {
			if (!orders || !orders.length) {
				return Promise.resolve([]);
			}
			var newOrders = orders;
			orders = [_.map(newOrders, function (order) {
					order.to_invoice = options.to_invoice || false;
					for ( var i = 0; i < order.data.lines.length; i++ ) {
						var orderline = order.data.lines[i];
						if (orderline[2].gift_tax_id){
							var tax_id = orderline[2].gift_tax_id;
							order.data.lines[i][2]['tax_ids'][0][2] = [tax_id];
						}
					}
					return order;
				})];
			return _super_posmodel._save_to_server.apply(this, arguments);
		},
	});

});