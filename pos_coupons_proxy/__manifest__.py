# -*- coding: utf-8 -*-
{
	"name": "POS Coupons Proxy",
	'author': 'Conflux',
	'category': 'Point Of Sale',
	"description": "POS Promotional Coupon Proxy",
	"summary": "POS Promotional Coupon Proxy",
	"version": "13.0.1.1",
	"depends": ["pos_coupons","pos_print_proxy"],
	"data": [
		'views/templates.xml',
	],
	'qweb':[
		'static/src/xml/*',
	],
	'website': 'https://conflux.pe',
	'support': 'contacto@conflux.pe',
	"auto_install": False,
	"installable": True,
	'application': False,
	'license': 'OPL-1',
}