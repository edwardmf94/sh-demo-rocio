# -*- coding: utf-8 -*-
{
	'name': 'POS Peru Print',
	'version': '13.0.1',
	'category': 'Point Of Sale',
	'author': 'Conflux',
	'sequence': 10,
	'summary': 'Punto de Venta para Perú',
	'description': "",
	'depends': ['pos_print_proxy','l10n_pe_pos_edi'],
	'data': [
		'views/pos_order_view.xml',
		'views/pos_config_view.xml',
		'views/templates.xml',
	],
	'qweb': ['static/src/xml/*'],
	'installable': True,
	'application': False,
	'license': 'OPL-1',
}