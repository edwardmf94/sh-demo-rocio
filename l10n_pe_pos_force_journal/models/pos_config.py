# -*- coding: utf-8 -*-
from odoo import fields, models

class PosConfigInherit(models.Model):
	_inherit = 'pos.config'

	force_journal = fields.Boolean(string='Forzar elegir diario', default=False)
