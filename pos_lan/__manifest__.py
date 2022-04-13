# -*- coding: utf-8 -*-
{
    'name': 'POS LAN',
    'version': '13.0.1',
    'category': 'Point Of Sale',
    'author': 'Conflux',
    'sequence': 10,
    'summary': 'Implementacion de clientes locales',
    'description': "",
    'depends': ['pos_base','pos_hr','pos_print_proxy'],
    'data': [
        'views/pos_config_view.xml',
        'views/pos_order_view.xml',
        'views/hr_employee_view.xml',
        'views/templates.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'application': False,
    'license': 'OPL-1',
}