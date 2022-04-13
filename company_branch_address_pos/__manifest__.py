# -*- coding: utf-8 -*-
{
    'name': 'Company Branch Address in PdV',
    'version': '13.0.1',
    'category': 'Inventory',
    'author': 'Conflux',
    'sequence': 12,
    'description': "",
    'depends': ['company_branch_address_account','point_of_sale'],
    'data': [
        'security/res_company_branch_address_security.xml',
        'views/pos_views.xml',
    ],
    'installable': True,
    'application': False,
    'license': 'OPL-1',
}