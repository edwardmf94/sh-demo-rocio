odoo.define('pos_gifts.screens', function (require) {
	"use strict";

	var screens = require('point_of_sale.screens');

	screens.ProductScreenWidget.include({
		start: function() {
			var self = this;
			this._super();
			this.$('[name=btnTaxesFree]').click(function() {
				self.gui.show_popup('TaxesFreeWidget');
			});
            if(!self.pos.config.pos_gifts){
                self.$('[name=btnTaxesFree]').remove();
            }
		}
	})

});