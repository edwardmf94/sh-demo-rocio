# -*- coding: utf-8 -*-
{
    'name': 'POS Historial de Cliente',
    'version': '13.0.1',
    'category': 'Point Of Sale',
    'author': 'Conflux',
    'sequence': 10,
    'summary': 'Vista de pos orders en pdv dependiendo del cliente',
    'description': "",
    'depends': ['pos_history'],
    'data': [
        'views/pos_config_view.xml',
        'views/templates.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'application': False,
    'license': 'OPL-1',
}