# -*- coding: utf-8 -*-
{
    "name": "POS Forzar fecha",
    "description": "Fuerza fecha en POS",
    "depends": ["pos_base"],
    "data": [
        'views/templates.xml',
        'views/pos_config_view.xml',
        'views/pos_order_view.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}