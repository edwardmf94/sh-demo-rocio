# -*- coding: utf-8 -*-
{
	'name': 'POS Peru EDI',
	'version': '13.0.1',
	'category': 'Point Of Sale',
	'author': 'Conflux',
	'sequence': 10,
	'summary': 'Punto de Venta para Perú',
	'description': "",
	'depends': ['l10n_pe_pos','company_branch_address_pos','pos_history','l10n_pe_edi_extended'],
	'data': [
		'views/pos_order_view.xml',
		'views/templates.xml',
	],
	'qweb': ['static/src/xml/*'],
	'installable': True,
	'application': False,
	'license': 'OPL-1',
}