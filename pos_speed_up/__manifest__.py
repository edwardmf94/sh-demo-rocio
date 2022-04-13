# -*- coding: utf-8 -*-
{
    'name': 'POS Speed Up',
    'version': '13.0.3',
    'category': 'Point Of Sale',
    'author': 'D.Jane',
    'sequence': 10,
    'summary': 'Boosts Odoo POS loading speed 1000-times faster. POS fast loading, solving POS slow loading problem.',
    'description': "",
    'depends': ['point_of_sale','pos_base'],
    'data': [
        'security/ir.model.access.csv',
        'views/header.xml',
        'views/clear_pos_data.xml'
    ],
    'images': ['static/description/banner.jpg'],
    'qweb': ['static/src/xml/loading.xml'],
    'installable': True,
    'application': True,
    'price': 199,
    'license': 'OPL-1',
    'currency': 'EUR',
}
