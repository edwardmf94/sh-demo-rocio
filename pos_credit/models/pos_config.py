# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class PosConfig(models.Model):
    _inherit = 'pos.config'
    
    allow_credit = fields.Boolean(string='Permitir creditos (fianzas)',default=False)
    limit_credit = fields.Boolean(string='Limita ventas encima del credito',default=False)
