# -*- coding: utf-8 -*-
{
    'name': 'POS HR Discount',
    'version': '13.0.1',
    'category': 'Point Of Sale',
    'author': 'Conflux',
    'sequence': 10,
    'summary': 'Aplicar descuentos segun empleado en POS',
    'description': "",
    'depends': ['pos_hr','pos_discount','pos_base'],
    'data': [
        'views/templates.xml',
        'views/hr_employee_view.xml',
        'views/res_config_view.xml',
        'views/pos_config_view.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'application': False,
    'license': 'OPL-1',
}