# -*- coding: utf-8 -*-
{
	'name': 'POS Force Journal',
	'version': '13.0.1',
	'category': 'Point Of Sale',
	'author': 'Conflux',
	'sequence': 10,
	'summary': 'Punto de Venta Forzar elegir diario',
	'description': "",
	'depends': ['point_of_sale','l10n_pe_pos'],
	'data': [
		'views/pos_config_view.xml',
		'views/templates.xml',
	],
	'qweb': ['static/src/xml/*'],
	'installable': True,
	'application': False,
	'license': 'OPL-1',
}