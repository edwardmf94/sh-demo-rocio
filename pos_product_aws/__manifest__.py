# -*- coding: utf-8 -*-
{
    "name": "POS Imagen de AWS",
    "description": "Se mostraran las imagenes de AWS en POS",
    "depends": ["product_aws"],
    "author": 'Conflux SRL',
    "data": [
        'views/templates.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}