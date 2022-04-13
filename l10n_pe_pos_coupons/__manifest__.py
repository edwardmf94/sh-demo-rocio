# -*- coding: utf-8 -*-
{
	"name": "Peru POS Coupons",
	'author': 'Conflux',
	'category': 'Sales/Point Of Sale',
	"description": "Peruvian POS Promotional Coupon & Promotional Program",
	"version": "13.0.1.1",
	"price": 150.00,
	"currency": "EUR",
	"depends": ["pos_coupons","l10n_pe_pos_bonification","l10n_pe_pos_edi"],
	"data": [
		'views/templates.xml',
	],
	'qweb':[
		'static/src/xml/*',
	],
	"auto_install": False,
	"installable": True,
	'application': False,
	'license': 'OPL-1',
}