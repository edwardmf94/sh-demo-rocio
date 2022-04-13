odoo.define('pos_product_supplier.screens', function (require) {
    "use strict";

    var module = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;
    var models = module.PosModel.prototype.models;

    screens.ProductListWidget.include({
        get_product_data_row: function(product){
			var self = this;
            var data = this._super(product);
            data.suppliers = [];
            var suppliers = this.pos.db.supplierinfo_by_product[product.product_tmpl_id];
            if(suppliers){
                data.suppliers = suppliers;
            }
            return data;
        },
		render_product: function(product){
			var self = this;
			var current_pricelist = this._get_active_pricelist();
			var cache_key = this.calculate_cache_key(product, current_pricelist);
			var cached = this.product_cache.get_node(cache_key);
			if(!cached){
				var data = []
				data.suppliers = [];
				var suppliers = this.pos.db.supplierinfo_by_product[product.product_tmpl_id];
				if(suppliers){
					data.suppliers = suppliers;
				}
				var product_html = QWeb.render('Product', {
						widget:  this,
						product: product,
						suppliers: data.suppliers,
						pricelist: current_pricelist,
						image_url: this.get_product_image_url(product),
					});
				var product_node = document.createElement('tbody');
				product_node.innerHTML = product_html;
				product_node = product_node.childNodes[1];
				this.product_cache.cache_node(cache_key,product_node);
				return product_node;
			}
			return cached;
		},
    });
});