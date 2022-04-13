# -*- coding: utf-8 -*-
from odoo import models, fields, api

#import logging
#log = logging.getLogger(__name__)

class PosOrder(models.Model):
	_inherit = "pos.order"

	seller_id = fields.Many2one(string='Seller',comodel_name='hr.employee')

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder,self)._order_fields(ui_order)
		res['seller_id'] = ui_order.get('seller_id',False)
		return res

	@api.model
	def get_print(self, order_id):
		res = super(PosOrder,self).get_print(order_id)
		order = self.browse(order_id)
		res['seller_name'] = order.seller_id.name
		return res
