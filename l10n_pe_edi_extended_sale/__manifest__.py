# -*- coding: utf-8 -*-
{
    'name': "Perú Sale - E-invoicing",

    'summary': """
        Adds direct relation between sales and einvoices.""",

    'description': """
        Adds direct relation between sales and einvoices.
    """,

    'author': "Conflux",
    'website': "https://conflux.pe",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Localization/Peru',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['l10n_pe_edi_extended', 'sale'],

    # always loaded
    'data': [
        
    ]
}