# -*- coding: utf-8 -*-
{
    'name': 'POS LAN Restaurant',
    'version': '13.0.1',
    'category': 'Point Of Sale',
    'author': 'Conflux',
    'sequence': 10,
    'summary': 'Implementacion de clientes locales',
    'description': "",
    'depends': ['pos_lan', 'pos_restaurant'],
    'data': [
        'views/templates.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'application': False,
    'license': 'OPL-1',
}