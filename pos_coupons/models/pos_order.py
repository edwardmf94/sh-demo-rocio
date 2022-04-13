# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class PosOrder(models.Model):
	_inherit = 'pos.order'

	coupon_id = fields.Many2one('sale.coupon',string='Coupon used')
	coupon_program_ids = fields.Many2many('pos.order.coupon',string='Coupons generated')

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder,self)._order_fields(ui_order)
		coupon = ui_order.get('coupon_id',False)
		if coupon != False:
			res['coupon_id'] = coupon['id']
		coupons = ui_order.get('coupon_program',False)
		if coupons != False:
			if len(coupons) > 0:
				coupon_ids = []
				for coupon in coupons:
					coupon_id = self.env['sale.coupon'].create({
						'code': coupon['coupon_uid'],
						'program_id': coupon['program_id']
					})
					line_id = self.env['pos.order.coupon'].create({
						'coupon_program_id': coupon['program_id'],
						'coupon_id': coupon_id.id
					})
					coupon_ids.append(line_id.id)
				res['coupon_program_ids'] = [(6,0,coupon_ids)]
		return res

	@api.model
	def create_from_ui(self, orders, draft=False):
		res = super(PosOrder, self).create_from_ui(orders, draft)
		for order_id in res:
			order = self.browse(order_id['id'])[0]
			if order.coupon_id:
				order.coupon_id.write({
					'pos_order_id': order.id,
					'state': 'used'
				})
		return res

class PosOrderCoupon(models.Model):
	_name = 'pos.order.coupon'
	_description = 'Coupons generated from pos order'

	order_id = fields.Many2one('pos.order',string='POS Order')
	coupon_program_id = fields.Many2one('sale.coupon.program',string='Coupon Program')
	coupon_id = fields.Many2one('sale.coupon',string='Generated Coupon')