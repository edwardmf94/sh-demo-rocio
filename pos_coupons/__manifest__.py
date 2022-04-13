# -*- coding: utf-8 -*-
{
	"name": "POS Coupons",
	'author': 'Conflux',
	'category': 'Sales/Point Of Sale',
	"description": "POS Promotional Coupon & Promotional Program",
	"summary": "POS Promotional Coupon & Promotional Program",
	"version": "13.0.1.1",
	"price": 50.00,
	"currency": "EUR",
	"depends": ["pos_base","sale_coupon"],
	"data": [
		'security/ir.model.access.csv',
		'views/templates.xml',
		'views/pos_config_view.xml',
		'views/pos_order_view.xml',
	],
	'qweb':[
		'static/src/xml/*',
	],
	'images': ['static/description/pos2.jpg'],
	'website': 'https://conflux.pe',
	'support': 'contacto@conflux.pe',
	"auto_install": False,
	"installable": True,
	'application': False,
	'license': 'OPL-1',
}