# -*- coding: utf-8 -*-
{
    'name': 'Document Type',
    'version': '13.0.1.1.0',
    'author': 'Ganemo',
    'website': 'https://www.ganemo.co',
    'description': """
    Sirve para relacionar y administrar el tipo de documento exitigo por SUNAT ( DNI, RUC; otros)
    - OBJETO HEREDADO: l10n_latam.identification.type
    Además, añadir la validación, al guardar un res.partner, y al hacer un cambio sobre el campo “vat”, o “document_type_id” del res.partner, que si no cumple las condiciones de los parámetros en los nuevos campos creados arriba.
    """,
    'depends': [
        'contacts',
        'l10n_pe'
    ],
    'data': [
        'security/ir.model.access.csv',
        'static/src/xml/qweb_extend.xml',
        'views/l10n_latam_identification_type_view.xml',
        'views/partner_views.xml'
    ],
    'installable': True,
    'auto_install': False,
    'license': 'LGPL-3',
    'currency': 'USD',
    'price': 0.00
}
