# -*- coding: utf-8 -*-
from odoo import models, fields, api

class PosConfig(models.Model):
	_inherit = "pos.config"

	pos_gifts = fields.Boolean(string='Enable Taxes Free in Product',default=False)
