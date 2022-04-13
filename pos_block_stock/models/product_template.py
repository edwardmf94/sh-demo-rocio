# -*- coding: utf-8 -*-
from odoo import models, fields, api

class ProductTemplate(models.Model):
	_inherit = "product.template"

	pos_blocked_wh_ids = fields.Many2many('stock.location',string='Almacenes bloqueados en POS')