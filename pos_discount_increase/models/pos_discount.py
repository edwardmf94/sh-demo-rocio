# -*- coding: utf-8 -*-
from odoo import models, fields, api


class PosDiscount(models.Model):
    _name = 'pos.discount'
    _description = 'Descuento de PO'
    _order = 'code'

    code = fields.Char('Reference')
    active = fields.Boolean('Activo', default=True)
    name = fields.Char(string="Nombre del descuento", required=True)
    percent = fields.Float(string="Porcentaje del descuento", required=True)
    company_id = fields.Many2one('res.company', 'Compañia', default=lambda self: self.env.user.company_id, required=True)
