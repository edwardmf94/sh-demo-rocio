# -*- coding: utf-8 -*-
{
	'name': 'POS Summary Proxy',
	'version': '13.0.1',
	'category': 'Point Of Sale',
	'author': 'Conflux',
	'sequence': 10,
	'summary': 'POS Summary Print via Proxy',
	'description': "",
	'depends': ['pos_print_proxy','pos_summary'],
	'data': [
		'views/templates.xml',
	],
	'qweb': ['static/src/xml/*'],
	'installable': True,
	'application': False,
	'license': 'OPL-1',
}