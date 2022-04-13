odoo.define('pos_sale_list.models', function(require) {
	'use strict';

	var models = require('point_of_sale.models');

	var _super_order = models.Order.prototype;
	models.Order = models.Order.extend({
		initialize: function() {
			_super_order.initialize.apply(this, arguments);
			this.sale_order_id = this.sale_order_id || false;
			this.note_sale = this.note_sale || '';
			this.save_to_db();
		},
		init_from_JSON: function(json) {
			var self = this;
			_super_order.init_from_JSON.apply(this, arguments);
			self.sale_order_id = json.sale_order_id;
			self.note_sale = json.note_sale;
		},
		export_as_JSON: function() {
			var json = _super_order.export_as_JSON.apply(this, arguments);
			json.sale_order_id = this.get_sale_order()
				? this.get_sale_order()
				: false;
			json.note_sale = this.get_note_sale()
				? this.get_note_sale()
				: '';
			return json;
		},
		set_sale_order: function(sale_order_id) {
			var self = this;
			this.assert_editable();
			this.sale_order_id = sale_order_id;
			this.save_to_db();
		},
		get_sale_order: function() {
			return this.sale_order_id;
		},
		set_note_sale: function(note_sale) {
			var self = this;
			this.assert_editable();
			this.note_sale = note_sale;
			this.save_to_db();
		},
		get_note_sale: function() {
			return this.note_sale;
		},
	});
});