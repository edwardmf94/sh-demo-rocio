# -*- coding: utf-8 -*-
{
    'name': 'POS Resumen',
    'version': '13.0.1',
    'category': 'Point Of Sale',
    'author': 'Conflux',
    'sequence': 11,
    'summary': 'Agrega reporte de arqueo y vista de resumen dentro de pos',
    'description': "",
    'depends': ['pos_base'],
    'data': [
        'views/templates.xml',
        'views/pos_config.xml',
        'reports/report_session_arching.xml',
    ],
    'qweb': ['static/src/xml/*.xml'],
    'installable': True,
    'application': False,
    'license': 'OPL-1',
}