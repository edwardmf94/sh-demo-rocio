# -*- coding: utf-8 -*-
from odoo import fields, models

class PosConfigInherit(models.Model):
	_inherit = 'pos.config'

	itserie_ids = fields.Many2many('it.invoice.serie', string='Series comp.', help='Accounting extra journals used to post sales entries.',)
