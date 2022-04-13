# -*- coding: utf-8 -*-
from odoo import models, fields, api
import logging
log = logging.getLogger(__name__)


class Config(models.Model):
	_inherit = "pos.config"

	company_branch_address_id = fields.Many2one('res.company.branch.address', string='Establecimiento anexo')
	company_branch_address = fields.Char(
		related='company_branch_address_id.partner_id.street', string='Direccion de emision', store=True, readonly=True)


class Session(models.Model):
	_inherit = "pos.session"

	company_branch_address_id = fields.Many2one('res.company.branch.address', string='Establecimiento anexo')


class PosOrder(models.Model):
	_inherit = "pos.order"

	company_branch_address_id = fields.Many2one('res.company.branch.address', string='Establecimiento anexo')

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder,self)._order_fields(ui_order)
		res['company_branch_address_id'] = ui_order.get('company_branch_address_id',False)
		if not res['company_branch_address_id']:
			session_id = self.env['pos.session'].browse(ui_order['pos_session_id'])
			res['company_branch_address_id'] = session_id.config_id.company_branch_address_id.id if session_id.config_id.company_branch_address_id else False
		return res

	def _prepare_invoice_vals(self):
		res = super(PosOrder,self)._prepare_invoice_vals()
		if not res.get('company_branch_address_id',False):
			res['company_branch_address_id'] = self.config_id.company_branch_address_id.id
		return res