# -*- coding: utf-8 -*-
{
    "name": "POS Descuentos e Incrementos",
    "description": "Modulo que agrega descuentos o incrementos globalmente a un pedido",
    "depends": ["pos_base", "l10n_pe"],
    "author": 'Conflux SRL',
    "data": [
        'security/ir.model.access.csv',
        'views/pos_config_view.xml',
        'views/pos_discount_view.xml',
        'views/pos_increase_view.xml',
        'views/pos_order_view.xml',
        'views/templates.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}