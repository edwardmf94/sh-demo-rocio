# -*- coding: utf-8 -*-
from odoo import models, fields, api, tools, _
from odoo.tools import float_is_zero

class PosOrder(models.Model):
	_inherit = 'pos.order'

	forced_date = fields.Date(string='Forced Date')

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder,self)._order_fields(ui_order)
		res['forced_date'] = ui_order.get('forced_date',False)
		return res
	"""
	def _prepare_invoice(self):
		res = super(PosOrder,self)._prepare_invoice()
		if self.session_id.config_id.allow_outdate and self.forced_date:
			self.write({
				'date_order': self.forced_date + ' 05:00:00'
			})
			res['date_invoice'] = self.forced_date
		return res
	"""