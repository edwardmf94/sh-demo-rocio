# -*- coding: utf-8 -*-
from odoo import models, fields, api

class StockInventory(models.Model):
	_inherit = "stock.inventory"

	pos_blocked = fields.Boolean(string='Los productos están bloqueados',default=False)

	def action_pos_block(self):
		for line in self.line_ids:
			line.product_id.product_tmpl_id.write({
				'pos_blocked_wh_ids': [(4,line.location_id.id)]
			})
		self.write({
			'pos_blocked': True
		})

	def action_pos_unblock(self):
		for line in self.line_ids:
			line.product_id.product_tmpl_id.write({
				'pos_blocked_wh_ids': [(3,line.location_id.id)]
			})
		self.write({
			'pos_blocked': False
		})

	def action_validate(self):
		super(StockInventory, self).action_validate()
		if self.pos_blocked == True:
			for line in self.line_ids:
				line.product_id.product_tmpl_id.write({
					'pos_blocked_wh_ids': [(3,line.location_id.id)]
				})

	def action_cancel_draft(self):
		super(StockInventory, self).action_cancel_draft()
		if self.pos_blocked == True:
			for line in self.line_ids:
				line.product_id.product_tmpl_id.write({
					'pos_blocked_wh_ids': [(3,line.location_id.id)]
				})