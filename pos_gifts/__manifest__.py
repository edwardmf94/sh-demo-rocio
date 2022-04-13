# -*- coding: utf-8 -*-
{
    "name": "POS Gifts",
    "description": "Modulo reemplazar impuesto libre en POS",
    "depends": ["pos_base", "l10n_pe"],
    'author': 'Conflux',
    "data": [
        'views/pos_config_view.xml',
        'views/templates.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}