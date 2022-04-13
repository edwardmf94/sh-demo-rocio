# -*- coding: utf-8 -*-
from odoo import api, models, fields, _

import logging
log = logging.getLogger(__name__)


class SaleOrder(models.Model):
	_inherit = "sale.order"

	shipped_stock = fields.Boolean(string='Attended in warehouse', default=False)
	employee_id = fields.Many2one(string='Employee', comodel_name='hr.employee')
	requested_date = fields.Datetime(string='Scheduled Date')

	@api.model
	def get_shipped(self, order_id):
		sale_order = self.browse(order_id)
		sale_order[0].write({
			'shipped_stock': True
		})
		self.env.cr.commit()
		return True

	@api.model
	def load_from_ui(self, order_id):
		sale_order = self.browse(order_id)
		condition = [('order_id', '=', order_id)]
		fields = ['product_id', 'price_unit', 'price_subtotal', 'price_total', 'product_uom_qty', 'discount', 'product_uom','name']
		order_line = self.order_line.search_read(condition, fields)
		address = '-'
		if sale_order.partner_id.street:
			address = sale_order.partner_id.street
		if sale_order.payment_term_id == False:
			payment_term_id = sale_order.partner_id.payment_term_id.id
		else:
			payment_term_id = sale_order.payment_term_id.id
		return {
			'id': sale_order.id,
			'name': sale_order.name,
			'date': sale_order.date_order,
			'_date': sale_order.requested_date,
			'_date': sale_order.date_order,
			'partner_id': sale_order.partner_id.id,
			'partner_name': sale_order.partner_id.name,
			'partner_address': address,
			'payment_term_id': payment_term_id,
			'user_id': sale_order.user_id.id,
			'seller_id': sale_order.employee_id.id,
			'user_name': sale_order.user_id.name,
			'wh_name': sale_order.warehouse_id.name,
			'amount_total': sale_order.amount_total,
			'amount_tax': sale_order.amount_tax,
			'note': sale_order.note,
			'order_line': order_line,
			'qty_items': len(order_line)
		}

	@api.model
	def create_from_ui(self, data):
		sale_order = self.create(data)
		sale_order.action_confirm()
		condition = [('order_id', '=', sale_order.id)]
		fields = ['product_id', 'price_unit', 'price_subtotal', 'price_total', 'product_uom_qty', 'discount', 'product_uom','name']
		order_line = self.order_line.search_read(condition, fields)
		address = '-'
		if sale_order.partner_id.street:
			address = sale_order.partner_id.street
		return {
			'id': sale_order.id,
			'name': sale_order.name,
			'date': sale_order.date_order,
			'_date': sale_order.requested_date,
			'partner_id': sale_order.partner_id.id,
			'partner_name': sale_order.partner_id.name,
			'partner_address': address,
			'seller_id': sale_order.employee_id.id,
			'seller_name': sale_order.employee_id.name,
			'user_id': sale_order.user_id.id,
			'user_name': sale_order.user_id.name,
			'wh_name': sale_order.warehouse_id.name,
			'amount_total': sale_order.amount_total,
			'amount_tax': sale_order.amount_tax,
			'order_line': order_line,
			'qty_items': len(order_line)
		}

	@api.model
	def create(self, values):
		record = super(SaleOrder, self).create(values)
		if 'warehouse_id' not in values:
			company = self.env.user.company_id.id
			warehouse_ids = self.env['stock.warehouse'].search([('company_id', '=', company)], limit=1)
			record['warehouse_id'] = warehouse_ids[0].id
		return record
