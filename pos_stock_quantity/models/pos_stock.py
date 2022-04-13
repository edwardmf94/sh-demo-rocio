# -*- coding: utf-8 -*-

from odoo import api, fields, models
from collections import deque

import logging
log = logging.getLogger(__name__)


class StockQuantity(models.Model):
	_inherit = 'stock.quant'

	@api.model
	def get_qty_available(self, picking_type_id, location_ids=None, product_ids=None):
		picking_type_id = self.env['stock.picking.type'].browse(picking_type_id)
		if picking_type_id:
			location_id = picking_type_id.default_location_src_id.id
			root_location = self.env['stock.location'].browse(location_id)
			all_location = [root_location.id]
			queue = deque([])
			self.location_traversal(queue, all_location, root_location)
			stock_quant = self.search_read([('location_id', 'in', all_location)], ['product_id', 'quantity', 'location_id'])
		else:
			stock_quant = self.search_read([('location_id', 'in', location_ids), ('product_id', 'in', product_ids)],
										['product_id', 'quantity', 'location_id'])
		return stock_quant

	def location_traversal(self, queue, res, root):
		for child in root.child_ids:
			if child.usage == 'internal':
				queue.append(child)
				res.append(child.id)
		while queue:
			pick = queue.popleft()
			res.append(pick.id)
			self.location_traversal(queue, res, pick)

	@api.model
	def create(self, vals):
		res = super(StockQuantity, self).create(vals)
		if res.location_id.usage == 'internal':
			self.env['pos.stock.channel'].broadcast(res)
		return res

	def write(self, vals):
		record = self.filtered(lambda x: x.location_id.usage == 'internal')
		self.env['pos.stock.channel'].broadcast(record)
		return super(StockQuantity, self).write(vals)


class PosConfig(models.Model):
	_inherit = 'pos.config'

	show_qty_available = fields.Boolean(string='Display Stock in POS')
	location_only = fields.Boolean(string='Only in POS Location')
	allow_out_of_stock = fields.Boolean(string='Allow Out-of-Stock')
	limit_qty = fields.Integer(string='Deny Order when Quantity Available lower than')
	hide_product = fields.Boolean(string='Hide Products not in POS Location')


class PosStockChannel(models.TransientModel):
	_name = 'pos.stock.channel'

	def broadcast(self, stock_quant):
		data = stock_quant.read(['product_id', 'location_id', 'quantity'])
		self.env['bus.bus'].sendone((self._cr.dbname, 'pos.stock.channel'), data)
