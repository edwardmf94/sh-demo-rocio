# -*- coding: utf-8 -*-
{
    "name": "POS Gifts Cards",
    "description": "Modulo para agregar vales de canje de regalo en POS",
    "depends": ["pos_base"],
    "author": 'Conflux SRL',
    "data": [
        'security/ir.model.access.csv',
        'views/templates.xml',
        'views/pos_gift_card_views.xml',
        'views/pos_payment_view.xml',
        'views/pos_order_view.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}