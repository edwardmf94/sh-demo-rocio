# -*- coding: utf-8 -*-
{
	'name': 'POS Peru ITGRUPO',
	'version': '13.0.1',
	'category': 'Point Of Sale',
	'author': 'Conflux',
	'sequence': 10,
	'summary': 'Punto de Venta para localización ITGRUPO',
	'description': "",
	'depends': ['point_of_sale','l10n_pe_pos_edi','account_base_it','l10n_pe_edi_itgrupo','pos_credit','pos_coupons','pos_history'],
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