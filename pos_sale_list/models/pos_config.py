# -*- coding: utf-8 -*-
from odoo import models, fields, api


class PosConfig(models.Model):
	_inherit = "pos.config"

	pos_sale = fields.Boolean(string='Connection with Corporate Sales',default=False)
