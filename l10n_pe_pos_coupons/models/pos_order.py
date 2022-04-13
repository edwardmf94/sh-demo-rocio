# -*- coding: utf-8 -*-
from odoo import api,fields, models

class PosOrder(models.Model):
	_inherit = 'pos.order'

	@api.model
	def get_print(self, order_id):
		result = super(PosOrder, self).get_print(order_id)
		order = self.browse(order_id)
		if order.coupon_id:
			result['coupon_id'] = order.coupon_id.code
		return result