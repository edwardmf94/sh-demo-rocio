# -*- coding: utf-8 -*-
from odoo import models, fields, api


class PosOrder(models.Model):
	_inherit = 'pos.order'

	global_increase_id = fields.Many2one('pos.increase', string='Incremento global', copy=False, readonly=True, default=False)
	global_discount_id = fields.Many2one('pos.discount', string='Descuento global', copy=False, readonly=True, default=False)

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder,self)._order_fields(ui_order)
		res['global_increase_id'] = ui_order.get('global_increase_id',False)
		res['global_discount_id'] = ui_order.get('global_discount_id',False)
		return res
