# -*- coding: utf-8 -*-
{
	'name': 'POS Print',
	'version': '13.0.1',
	'category': 'Point Of Sale',
	'author': 'Conflux',
	'sequence': 10,
	'summary': 'Punto de Venta Proxy Print',
	'description': "",
	'depends': ['point_of_sale','pos_base'],
	'data': [
		'views/pos_config_view.xml',
		'views/templates.xml',
	],
	'qweb': ['static/src/xml/*'],
	'installable': True,
	'application': False,
	'license': 'OPL-1',
}