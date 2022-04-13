# -*- coding: utf-8 -*-
{
    'name': 'Catálogos SUNAT - Yaros',
    'version': '13.0.3.0',
    'author': 'Consultoría Yaroslab',
    'website': 'http://www.yaroslab.com',
    'description': """
    Carga los catalogos exigidos por SUNAT
    Agrega catálogos SUNAT:\n
    - Tipo de Documento Venta [01]\n
    - Tipo de Documento [06]\n
    - Tipo de Afectación al IGV [07]\n
    - Tipo de Sistema de Cálculo del ISC [08]\n
    - Códigos de motivo de emisión de nota de crédito electrónica [09]\n
    - Códigos de modalidad de Traslado [18]\n
    - Códigos de motivo de Traslado [20]\n
    - Códigos de cargos o descuentos [53]
""",
    'depends': [
        'account',
        'motive_refund',
        'purchase_document_type_validation_yaros',
        'document_type_yaros',
        'localization_menu'
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/charge_discount_codes_data.xml',
        'data/document_type_data.xml',
        'data/invoice_document_type_data.xml',
        'data/reason_cancellation_credit_debit_data.xml',
        'data/igv_afectation_type_data.xml',
        'data/isc_calculation_system_data.xml',
        'data/transfer_reason_codes_data.xml',
        'data/transfer_type_codes_data.xml',
        'views/account_move_views.xml'
    ],
    'installable': True,
    'auto_install': False
}
