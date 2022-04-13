# -*- encoding: utf-8 -*-
{
    'name': 'POS Supplier List',
    'description': """
        Supplier Show in list view in Pont of Sale
	""",
    'version': '1.0',
    'author': "fnaquira",
    'license': '',
    'summary': """It will show supplier product in list view""",
    'category': 'Point of Sale',
    'website': 'http://www.conflux.pe',
    'images': [],
    'depends': ['point_of_sale'],
    'demo': [],
    'data': [
		'views/point_of_sale.xml',
	],
    'images': ['static/description/list_view.JPG'],
    'qweb': ['static/xml/pos.xml'],
    'active': False,
    'installable': True,
    'application': True,
}
