# -*- coding: utf-8 -*-
{
    "name": "POS Shortcuts",
    'author': 'Conflux',
    "description": "Configuración para permitir atajos de teclado en POS",
    "depends": ["pos_base","pos_product_list_view"],
    "data": [
        'views/templates.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}