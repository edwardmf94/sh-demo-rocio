# -*- coding: utf-8 -*-
from odoo import models, fields, api

class ResCompany(models.Model):
	_inherit = "res.company"

	pos_hr_discount_cashier = fields.Float(string="POS Discount Cashier",default=10.0)
	pos_hr_discount_manager = fields.Float(string="POS Discount Manager",default=20.0)
	pos_hr_discount_admin = fields.Float(string="POS Discount SuperAdmin",default=100.0)