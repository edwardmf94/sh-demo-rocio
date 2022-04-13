odoo.define('pos_product_supplier.db', function (require) {
	"use strict";

	var DB = require('point_of_sale.DB');

	DB.include({
		init: function(options){
			this._super();
			this.supplierinfo_by_id = {};
			this.supplierinfo_by_product = {};
		},
		add_supplierinfo: function(suppliers){
			var updated_count = 0;
			var new_write_date = '';
			var supply;
			for(var i = 0, len = suppliers.length; i < len; i++){
				supply = suppliers[i];
				if(!supply.product_code) supply.product_code = '';
				this.supplierinfo_by_id[supply.id] = supply;
				if(!this.supplierinfo_by_product[supply.product_tmpl_id[0]]){
					this.supplierinfo_by_product[supply.product_tmpl_id[0]] = [supply];
				}else{
					this.supplierinfo_by_product[supply.product_tmpl_id[0]].push(supply);
				}
				updated_count += 1;
			}
			return updated_count;
		},
	});

});