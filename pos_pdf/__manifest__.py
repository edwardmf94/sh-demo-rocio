# -*- coding: utf-8 -*-
{
	"name": "POS PDF",
	'author': 'Conflux',
	'category': 'Point Of Sale',
	"description": "POS print PDF",
	"summary": "POS print PDF",
	"version": "13.0.1.1",
	"depends": ["pos_base"],
	"data": [
		'views/templates.xml',
		'views/pos_config_view.xml',
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