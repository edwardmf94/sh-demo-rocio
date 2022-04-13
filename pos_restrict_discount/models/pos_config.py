# -*- coding: utf-8 -*-
from odoo import models, api, fields

class PosConfig(models.Model):
	_inherit = 'pos.config'

	restrict_discount_control = fields.Boolean(string='Restrict Discount Modifications to Managers',
		help="Only users with Manager access rights for PoS app can modify the product discount on orders.")