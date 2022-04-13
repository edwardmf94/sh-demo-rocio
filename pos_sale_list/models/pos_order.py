# -*- coding: utf-8 -*-
from odoo import models, fields, api, tools, _

import logging
log = logging.getLogger(__name__)


class PosOrder(models.Model):
	_inherit = "pos.order"

	sale_order_id = fields.Many2one('sale.order', string='Sale Order', required=False, copy=False)

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder,self)._order_fields(ui_order)
		res['sale_order_id'] = ui_order.get('sale_order_id',False)
		return res

	def create_picking(self):
		for order in self:
			if order.sale_order_id:
				picking_id = self.sale_order_id.picking_ids[0]
				order.write({'picking_id': picking_id.id})
				order._force_picking_done(picking_id)
			else:
				super(PosOrder,order).create_picking()
		return True

	def action_pos_order_invoice(self):
		res = super(PosOrder,self).action_pos_order_invoice()
		if self.sale_order_id:
			invoice = self.env['account.move'].browse(res['res_id'])
			for line in self.sale_order_id.order_line:
				li_id = False
				for lai in invoice.invoice_line_ids:
					if lai.product_id.id == line.product_id.id and lai.quantity == line.product_uom_qty:
						li_id = lai.id
				line.write({
					'invoice_status': 'invoiced'
				})
				if li_id:
					line.write({
						'invoice_lines': [(6,0,[li_id])]
					})
			self.sale_order_id.write({
				'invoice_status': 'invoiced',
			})
		return res
