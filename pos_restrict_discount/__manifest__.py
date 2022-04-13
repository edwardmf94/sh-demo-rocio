# -*- coding: utf-8 -*-
{
    "name": "POS Restrict Discounts",
    'author': 'Conflux',
    "description": "Configuración para restringir descuentos en POS",
    "depends": ["pos_base","pos_product_list_view"],
    "data": [
        'views/templates.xml',
        'views/pos_config_view.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}