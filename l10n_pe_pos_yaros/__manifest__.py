# -*- coding: utf-8 -*-
{
	'name': 'POS Peru YAROS',
	'version': '13.0.1',
	'category': 'Point Of Sale',
	'author': 'Conflux',
	'sequence': 10,
	'summary': 'Punto de Venta para localización yaros',
	'description': "",
	'depends': ['l10n_pe_pos_edi','l10n_pe_edi_yaros'],
	'data': [
		'views/templates.xml',
	],
	'qweb': ['static/src/xml/*'],
	'installable': True,
	'application': False,
	'license': 'OPL-1',
}