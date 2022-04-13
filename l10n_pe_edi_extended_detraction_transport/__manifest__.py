# -*- coding: utf-8 -*-
{
    'name': "Perú Transport Detractions - E-invoicing",

    'summary': """
        Adds Integration with transport detractions.""",

    'description': """
        Adds Integration with transport detractions.
    """,

    'author': "Conflux",
    'website': "https://conflux.pe",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Localization/Peru',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['l10n_pe_edi_extended'],

    # always loaded
    'data': [
        'views/account_move_view.xml',
    ]
}