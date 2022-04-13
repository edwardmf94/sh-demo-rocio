# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class PosConfig(models.Model):
	_inherit = 'pos.config'
	
	allow_create_coupons = fields.Boolean(string='Allow generate coupons',default=False)
	allow_read_coupons = fields.Boolean(string='Allow consume coupons',default=False)
