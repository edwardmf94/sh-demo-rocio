# coding: utf-8

from odoo import fields, models


class L10nLatamIdentificationType(models.Model):
    _inherit = 'l10n_latam.identification.type'

    code = fields.Char(string='Código')
    doc_length = fields.Integer(
        string='Longitud'
    )
    doc_type = fields.Selection(
        selection=[
            ('numeric', u'Númerico'),
            ('alphanumeric', u'Alfanúmerico'),
            ('other', 'Otros')],
        string='Tipo'
    )
    exact_length = fields.Selection(
        selection=[
            ('exact', u'Exacta'),
            ('maximum', u'Máxima')],
        string='Longitud Exacta'
    )
    nationality = fields.Selection(
        selection=[
            ('national', 'Nacional'),
            ('foreign', 'Extranjero'),
            ('both', 'Ambos')],
        string='Nacionalidad'
    )

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'El código ya fue utilizado.'),
        ('name_unique', 'UNIQUE(name)', 'El nombre debe ser único'),
    ]
