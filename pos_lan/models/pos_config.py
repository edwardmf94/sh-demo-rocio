# -*- coding: utf-8 -*-
from odoo import models, fields, api

#import logging
#log = logging.getLogger(__name__)

class PosConfig(models.Model):
	_inherit = "pos.config"

	pos_lan = fields.Boolean(string='Enable Cashier / Seller mode',default=False)
	print_dispatch = fields.Boolean(string='Print order in dispatch',default=False)
	pos_lan_delete = fields.Boolean(string='Delete order on payment',default=False)
	pos_lan_hr_select = fields.Boolean(string='Force to select employee each order',default=False)
