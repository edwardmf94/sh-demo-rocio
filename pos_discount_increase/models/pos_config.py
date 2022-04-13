# -*- coding: utf-8 -*-
from odoo import models, fields, api

class PosConfig(models.Model):
    _inherit = 'pos.config'

    allow_increase = fields.Boolean(string='Incrementar en precios',default=False)
    allow_discount = fields.Boolean(string='Descuentos en precios',default=False)
    only_admin_increase = fields.Boolean(string='Solamente administradores puede dar incrementos',default=True)
    only_admin_discount = fields.Boolean(string='Solamente administradores puede dar descuentos',default=True)
