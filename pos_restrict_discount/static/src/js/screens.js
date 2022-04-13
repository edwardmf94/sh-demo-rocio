odoo.define('pos_restrict_discount.screens', function(require) {
'use strict';

var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var session = require('web.session');
var core = require('web.core');
var rpc = require('web.rpc');

var QWeb = core.qweb;
var _t = core._t;

screens.NumpadWidget.include({
	applyAccessRights: function(){
		var cashier = this.pos.get('cashier') || this.pos.get_cashier();
		var has_discount_control_rights = !this.pos.config.restrict_discount_control || cashier.role == 'manager';
		this.$el.find('.mode-button[data-mode="discount"]')
			.toggleClass('disabled-mode', !has_discount_control_rights)
			.prop('disabled', !has_discount_control_rights);
		this._super();
	}
});

});