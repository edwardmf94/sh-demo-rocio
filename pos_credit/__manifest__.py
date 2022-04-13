# -*- coding: utf-8 -*-
{
    "name": "POS Credit",
    'author': 'Conflux',
    "description": "Configuración para permitir credito en POS",
    "depends": ["pos_base"],
    "data": [
        'views/templates.xml',
        'views/pos_config_view.xml',
        'views/pos_order_view.xml',
        'views/res_partner_view.xml',
        'reports/report_session_collection.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}