# -*- coding: utf-8 -*-
{
    'name': 'POS Order Cancel',
    'version': '13.0.1',
    'category': 'Point Of Sale',
    'author': 'Conflux',
    'summary': 'Create a picking return canceling de pos.order origin',
    'description': "",
    'depends': ['point_of_sale','stock'],
    'data': [
        #'views/templates.xml',
        'views/pos_order_view.xml',
    ],
    'qweb': [
        #'static/src/xml/pos.xml'
    ],
    "currency": "EUR",
    "auto_install": False,
    "installable": True,
    'application': False,
    'license': 'OPL-1'
}