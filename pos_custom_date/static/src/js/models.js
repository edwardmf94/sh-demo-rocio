odoo.define('pos_custom_date.models', function(require) {
	'use strict';

	var models = require('point_of_sale.models');

	var _super_order = models.Order.prototype;
	models.Order = models.Order.extend({
		initialize: function() {
			_super_order.initialize.apply(this, arguments);
			this.forced_date = this.forced_date || false;
			this.save_to_db();
		},
		init_from_JSON: function(json) {
			var self = this;
			_super_order.init_from_JSON.apply(this, arguments);
			if(json.forced_date){
				self.forced_date = json.forced_date;
			} else {
				self.forced_date = false;
			}
		},
		export_as_JSON: function() {
			var json = _super_order.export_as_JSON.apply(this, arguments);
			json.forced_date = this.get_forced_date();
			return json;
		},
		set_forced_date: function(forced_date) {
			this.assert_editable();
			this.forced_date = forced_date;
			this.save_to_db();
		},
		get_forced_date: function() {
			return this.forced_date;
		},
		get_order_date: function(){
			if(this.forced_date){
				return moment(this.forced_date).format('DD/MM/YYYY')+' 00:00:00';
			}else{
				return _super_order.get_order_date.apply(this, arguments);
			}
		}
	});

	var _super_pos = models.PosModel.prototype;
	models.PosModel = models.PosModel.extend({
		set_cashier: function(user){
			_super_pos.set_cashier.apply(this, arguments);
			if (this.config.allow_outdate){
				if(this.get('cashier').role === 'manager') {
					$('[name=btnOutDate]').attr('style','display:block !important');
				} else {
					$('[name=btnOutDate]').attr('style','display:none !important');
				}
			}
		},
	});

});
