# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class ResConfigSettings(models.TransientModel):
	_inherit = 'res.config.settings'
	
	pos_hr_discount_cashier = fields.Float(string="POS Discount Cashier",related='company_id.pos_hr_discount_cashier', readonly=False)
	pos_hr_discount_manager = fields.Float(string="POS Discount Manager",related='company_id.pos_hr_discount_manager', readonly=False)
	pos_hr_discount_admin = fields.Float(string="POS Discount SuperAdmin",related='company_id.pos_hr_discount_admin', readonly=False)