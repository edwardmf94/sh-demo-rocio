odoo.define("pos_product_supplier.models", function (require) {
    "use strict";
    
    var models = require('point_of_sale.models');
    
    models.load_fields("product.product",['seller_ids']);

	models.load_models({
		model: 'product.supplierinfo',
		fields: ['id', 'name', 'product_code', 'product_tmpl_id'],
		loaded: function(self, items) {
			self.db.add_supplierinfo(items);
		}
	});
    
});