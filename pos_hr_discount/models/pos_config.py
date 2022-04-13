# -*- coding: utf-8 -*-
from odoo import models, fields, api

class PosConfig(models.Model):
	_inherit = "pos.config"

	pos_hr_discount = fields.Boolean(string="Habilitar descuentos de personal",default=False)