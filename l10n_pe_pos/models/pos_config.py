# -*- coding: utf-8 -*-
from odoo import fields, models

class PosConfigInherit(models.Model):
	_inherit = 'pos.config'

	module_l10n_pe_pos_edi = fields.Boolean(string='Enables Peruvian electronic invoicing.')
	journal_ids = fields.Many2many('account.journal', string='Extra sale journals', help='Accounting extra journals used to post sales entries.',
					domain="[('type', '=', 'sale')]",)
	control_annul = fields.Boolean(string='Controlar anulaciones',default=False)
	allow_ticket = fields.Boolean(string='Permitir emitir ticket',default=False)
	allow_credit_note = fields.Boolean(string='Permitir emitir nota de credito',default=False)
	default_partner_id = fields.Many2one('res.partner', string="Cliente por defecto")
	cash_payment_term_id = fields.Many2one('account.payment.term', string='Termino de pago contado',required=True)
