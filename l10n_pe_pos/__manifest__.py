# -*- coding: utf-8 -*-
{
	'name': 'POS Peru',
	'version': '13.0.1',
	'category': 'Point Of Sale',
	'author': 'Conflux',
	'sequence': 10,
	'summary': 'Punto de Venta para Perú',
	'description': "",
	'depends': ['point_of_sale','l10n_pe_extended','pos_base', 'l10n_pe_ruc', 'pos_history', 'pos_credit'],
	'data': [
		'views/pos_config_view.xml',
		'views/pos_order_view.xml',
		'views/templates.xml',
	],
	'qweb': ['static/src/xml/*'],
	'installable': True,
	'application': False,
	'license': 'OPL-1',
}