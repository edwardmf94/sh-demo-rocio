odoo.define('pos_psms.models', function (require) {
	"use strict";

	var models = require('point_of_sale.models');

	models.load_fields('pos.config', ['psms','fuel_pump_ids']);

});