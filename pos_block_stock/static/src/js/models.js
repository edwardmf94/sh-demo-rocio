odoo.define('pos_block_stock.models', function(require) {
'use strict';

var models = require('point_of_sale.models');

models.load_fields('product.product', ['pos_blocked_wh_ids']);

var models_cache = models.PosModel.prototype.models;
models_cache.push({
	model: 'stock.picking.type',
	fields: ['default_location_src_id'],
	domain: function(self){
		return [['id','=',self.config.picking_type_id[0]]]
	},
	loaded: function(self,data){
		self.pos_location = {
			id: data[0].default_location_src_id[0],
			name: data[0].default_location_src_id[1]
		};
	},
});

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
	add_product: function(product, options){
		var self = this;
		var founded = false;
		if(product.pos_blocked_wh_ids){
			if(product.pos_blocked_wh_ids.length>0){
				founded = product.pos_blocked_wh_ids.includes(self.pos.pos_location.id);
			}
		}
		if(!founded){
			_super_order.add_product.apply(this, arguments);
		}else{
			alert('No se puede agregar este producto por estar bloqueado');
		}
	}
});

});