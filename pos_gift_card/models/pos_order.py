# -*- coding: utf-8 -*-
from odoo import models, fields, api, tools, _

import logging
log = logging.getLogger(__name__)


class PosOrder(models.Model):
	_inherit = "pos.order"

	@api.model
	def _payment_fields(self, order, ui_paymentline):
		res = super(PosOrder, self)._payment_fields(order, ui_paymentline)
		res.update({
			'gift_voucher_ref': ui_paymentline.get('gift_voucher_ref'),
		})
		return res

	def add_payment(self, data):
		super(PosOrder, self).add_payment(data)
		StatementLine = self.env['pos.payment']
		statement_lines = StatementLine.search([
			('pos_order_id', '=', data['pos_order_id']),
			('payment_method_id', '=', data['payment_method_id']),
			('amount', '=', data['amount'])
		])
		for line in statement_lines:
			if line.payment_method_id.gift_voucher:
				line.write({
						'gift_voucher_ref': data.get('gift_voucher_ref'),
					})
				break

	@api.model
	def create_from_ui(self, orders, draft=False):
		res = super(PosOrder, self).create_from_ui(orders, draft)
		for order_id in res:
			order = self.browse(order_id['id'])[0]
			for line in order.payment_ids:
				if line.gift_voucher_ref:
					card = self.env['pos.gift.card'].search([('name','=',line.gift_voucher_ref)])[0]
					if card.repeat == False:
						card.write({
							'state':'closed',
							'paid_reference':order.name
						})
					else:
						card.write({
							'counter':card.counter+1,
							'paid_reference':order.name
						})
		return res
