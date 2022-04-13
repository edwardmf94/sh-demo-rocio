# -*- coding: utf-8 -*-
{
    'name': "Integration EDI - Yaros Catalogs",
    'description': """
Integracion de catalogos de sunat yaros con facturacion electronica internacional
    """,

    'author': "Conflux",
    'website': "https://conflux.pe",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Localization',
    'version': '1.0',

    # any module necessary for this one to work correctly
    'depends': ['l10n_pe_edi_extended', 'l10n_pe_catalog_yaros', 'sale_document_prefix_and_sequence'],

    # always loaded
    'data': [
        'views/report_invoice.xml',
    ]
}