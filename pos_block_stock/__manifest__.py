# -*- coding: utf-8 -*-
{
    'name': 'POS Block Stock',
    'version': '13.0.1',
    'category': 'Point Of Sale',
    'author': 'Conflux',
    'sequence': 10,
    'summary': 'Bloquear producto en POS segun almacen',
    'description': "",
    'depends': ['stock','point_of_sale'],
    'data': [
        'views/templates.xml',
        'views/product_template_view.xml',
        'views/stock_inventory_view.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'application': False,
    'license': 'OPL-1',
}