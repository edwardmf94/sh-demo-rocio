# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class PosConfig(models.Model):
	_inherit = 'pos.config'
	
	allow_print_pdf = fields.Boolean(string='Allow print A4 PDF',default=False)
