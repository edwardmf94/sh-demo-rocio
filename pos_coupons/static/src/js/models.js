odoo.define('pos_coupons.models', function (require) {
"use strict";

var models = require('point_of_sale.models');
var rpc = require('web.rpc');

var models_cache = models.PosModel.prototype.models;

models_cache.push({
	model: 'sale.coupon.program',
	fields: ['name','validity_duration','reward_type','discount_line_product_id','discount_type','discount_apply_on','discount_max_amount','rule_min_quantity',
		'rule_minimum_amount','rule_products_domain','discount_percentage','reward_product_id','reward_product_quantity'],
	domain: [],
	loaded: function(self, documents){
		self.coupon_programs = documents;
		rpc.query({
			model: 'sale.coupon.program',
			method: 'pos_get_valid_products',
			args: [],
		}).then(function (response) {
			response.data.forEach(function(program){
				if(program.products.length>0){
					var index = self.coupon_programs.findIndex(function(item){
						return item.id == program.id;
					});
					if(index!=-1){
						self.coupon_programs[index].product_ids = program.products;
						if(program.partners){
							self.coupon_programs[index].partner_ids = program.partners;
						}
					}
				}
			});
		});
	},
});

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
	initialize: function() {
		_super_order.initialize.apply(this, arguments);
		this.coupon_program = this.coupon_program || false;
		this.coupon_id = this.coupon_id || false;
		this.save_to_db();
	},
	init_from_JSON: function(json) {
		var self = this;
		_super_order.init_from_JSON.apply(this, arguments);
		if(json.coupon_program){
			self.set_coupon_program(json.coupon_program);
		}
		if(json.coupon_id){
			self.set_coupon_id(json.coupon_id);
		}
	},
	export_as_JSON: function() {
		var json = _super_order.export_as_JSON.apply(this, arguments);
		json.coupon_program = this.get_coupon_program() ? this.get_coupon_program() : false;
		json.coupon_id = this.get_coupon_id() ? this.get_coupon_id() : false;
		return json;
	},
	export_for_printing: function() {
		var json = _super_order.export_for_printing.apply(this, arguments);
		json.coupon_program = this.get_coupon_program();
		json.coupon_id = this.get_coupon_id();
		return json;
	},
	set_coupon_program: function(program_id){
		this.coupon_program = program_id;
		this.save_to_db();
	},
	get_coupon_program: function(){
		return this.coupon_program;
	},
	set_coupon_id: function(coupon_id){
		this.coupon_id = coupon_id;
		this.save_to_db();
	},
	get_coupon_id: function(){
		return this.coupon_id;
	},
	apply_coupon: function(program, coupon_id, code){
		var self = this;
		if(!program) return false;
		if(program.reward_type=='discount'){
			var lines = self.get_orderlines();
			for (var i = 0; i < lines.length; i++) {
				lines[i].set_discount(program.discount_percentage);
			}
		}else{
			var product = self.pos.db.get_product_by_id(program.reward_product_id[0]);
			self.add_coupon_product(product, program.reward_product_quantity);
		}
		self.set_coupon_id({
			id: coupon_id,
			code: code,
			program: program
		});
	},
	add_coupon_product: function(product, quantity){
		var self = this;
		self.add_product(product, {quantity: quantity, discount: 100, merge: false});
	},
	remove_coupon: function(){
		var self = this;
		var coupon = self.get_coupon_id();
		if(coupon.program.reward_type=='discount'){
			var lines = self.get_orderlines();
			for (var i = 0; i < lines.length; i++) {
				lines[i].set_discount(0);
			}
		}else{
			var product_id = coupon.program.reward_product_id[0];
			self.remove_coupon_product(product_id);
		}
		self.set_coupon_id(false);
	},
	remove_coupon_product: function(product_id){
		var self = this;
		var lines = self.get_orderlines();
		for (var i = 0; i < lines.length; i++) {
			if (lines[i].get_product().id === product_id && lines[i].get_discount()==100) {
				self.remove_orderline(lines[i]);
			}
		}
	},
});

});