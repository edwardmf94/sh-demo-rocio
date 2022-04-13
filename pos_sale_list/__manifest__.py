# -*- coding: utf-8 -*-
{
    'name': 'POS Sale',
    'version': '13.0.1',
    'category': 'Point Of Sale',
    'author': 'Conflux',
    'sequence': 10,
    'summary': 'Integracion de POS con Ventas',
    'description': "",
    'depends': ['pos_base','sale_management','pos_sale','pos_lan'],
    'data': [
        'views/templates.xml',
        'views/pos_config_view.xml',
        'views/pos_order_view.xml',
        'views/sale_order_view.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'application': False,
    'license': 'OPL-1',
}