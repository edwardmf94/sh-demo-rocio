# -*- coding: utf-8 -*-
{
    'name': 'Localización menú',
    'version': '13.0.1.0.0',
    'author': 'Consultoría Yaroslab',
    'website': 'http://www.yaroslab.com',
    'description': """
Crea el menú padre Localización peruana.
    """,
    'depends': [
        'account'
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/account_menuitem.xml',
        'views/account_spot_views.xml'
    ],
    'installable': True,
    'auto_install': False
}
