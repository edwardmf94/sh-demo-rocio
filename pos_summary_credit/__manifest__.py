# -*- coding: utf-8 -*-
{
    "name": "POS Credito en Resumen",
    'author': 'Conflux',
    "description": "Credito en ticket de resumen de POS",
    "depends": ["pos_credit", "pos_summary"],
    "data": [
        'reports/report_session_arching_view_inherit.xml',
    ],
    'qweb':[
        'static/src/xml/*',
    ],
    'application': False,
}