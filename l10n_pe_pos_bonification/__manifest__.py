# -*- coding: utf-8 -*-
{
	'name': 'POS Peru Bonificacion',
	'version': '13.0.1',
	'category': 'Point Of Sale',
	'author': 'Conflux',
	'sequence': 10,
	'summary': 'Bonificaciones en PdV',
	'description': "",
	'depends': ['l10n_pe_pos_edi'],
	'data': [
		'views/pos_config_view.xml',
		'views/templates.xml',
	],
	'qweb': ['static/src/xml/*'],
	'installable': True,
	'application': False,
	'license': 'OPL-1',
}