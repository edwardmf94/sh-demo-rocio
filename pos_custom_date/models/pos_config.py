# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class PosConfig(models.Model):
    _inherit = 'pos.config'

    allow_outdate = fields.Boolean(string='Allow Forced Date',default=False)
