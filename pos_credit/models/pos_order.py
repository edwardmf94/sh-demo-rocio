# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError

#import logging
#log = logging.getLogger(__name__)

class PosOrder(models.Model):
	_inherit = 'pos.order'

	has_credit = fields.Boolean(string='Tiene credito',default=False, copy=False)

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder,self)._order_fields(ui_order)
		res['has_credit'] = ui_order.get('has_credit',False)
		return res

	def action_pos_order_paid(self):
		if not self._is_pos_order_paid():
			if self.has_credit:
				pass
			else:
				raise UserError("Orden no pagada por credito pendiente")
		self.write({'state': 'paid'})
		return self.create_picking()

	'''def _get_amount_receivable(self):
		if self.has_credit == False:
			return self.amount_paid
		else:
			return self.amount_total'''
	
	def _get_amount_credit(self):
		if self.has_credit == True:
			return self.amount_paid
		else:
			return 0