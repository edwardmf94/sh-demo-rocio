# -*- coding: utf-8 -*-
{
	"name": "POS Coupons Partner",
	'author': 'Conflux',
	'category': 'Point Of Sale',
	"description": "POS Promotional Coupon with Partners",
	"summary": "POS Promotional Coupon with Partners",
	"version": "13.0.1.1",
	"depends": ["pos_coupons","sale_coupon"],
	"data": [
		'views/templates.xml',
		'views/sale_coupon_program_view.xml',
	],
	'qweb':[
		'static/src/xml/*',
	],
	"auto_install": False,
	"installable": True,
	'application': False,
	'license': 'OPL-1',
}