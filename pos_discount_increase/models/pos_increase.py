# -*- coding: utf-8 -*-
from odoo import models, fields, api


class PosIncrease(models.Model):
    _name = 'pos.increase'
    _description = 'Incrementos de PO'
    _order = 'code'

    code = fields.Char('Reference')
    active = fields.Boolean('Activo', default=True)
    name = fields.Char(string="Nombre del incremento", required=True)
    percent = fields.Float(string="Porcentaje del incremento", required=True)
    company_id = fields.Many2one('res.company', string='Compañia', default=lambda self: self.env.user.company_id, required=True)
