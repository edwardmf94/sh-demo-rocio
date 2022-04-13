odoo.define('pos_product_aws.models', function(require) {
	'use strict';

	var models = require('point_of_sale.models');
	
	models.load_fields('product.product', ['image_s3_thumb','image_s3_thumb_url']);
});