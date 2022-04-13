# -*- coding: utf-8 -*-
{
    "name": "POS Lista de AWS",
    "description": "Se mostraran las imagenes de AWS en POS",
    "depends": ["product_aws", "pos_product_list_view"],
    "author": 'Conflux SRL',
    "data": [
        'views/templates.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}