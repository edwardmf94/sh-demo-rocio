# -*- coding: utf-8 -*-
{
    'name': 'POS Historial',
    'version': '13.0.1',
    'category': 'Point Of Sale',
    'author': 'Conflux',
    'sequence': 10,
    'summary': 'Vista de pos orders en pdv',
    'description': "",
    'depends': ['pos_base'],
    'data': [
        'views/templates.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'application': False,
    'license': 'OPL-1',
}