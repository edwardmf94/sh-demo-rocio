# -*- coding: utf-8 -*-
from odoo import api,fields, models

import logging
log = logging.getLogger(__name__)

class PosOrder(models.Model):
    _inherit = 'pos.order'

    offline_invoice_number = fields.Char(string='Secuencia de factura')
    offline_invoice_number_int = fields.Char(string='Numero de factura')
    payment_term_id = fields.Many2one('account.payment.term',string='Plazo de pago')

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res['offline_invoice_number'] = ui_order.get('offline_invoice_number', False)
        res['offline_invoice_number_int'] = ui_order.get('offline_invoice_number_int', False)
        res['payment_term_id'] = ui_order.get('payment_term_id', False)
        return res

    def _prepare_invoice_vals(self):
        res = super(PosOrder, self)._prepare_invoice_vals()
        res['name'] = self.offline_invoice_number if self.offline_invoice_number else "/"
        res['ref'] = self.offline_invoice_number if self.offline_invoice_number else "/"
        if self.payment_term_id:
            res['invoice_payment_term_id'] = self.payment_term_id.id
        return res

    def action_cancel_invoice(self, account_move):
        super(PosOrder, self).action_cancel_invoice(account_move)
        account_move.l10n_pe_dte_action_cancel()

    def action_pos_order_cancel(self):
        res = super(PosOrder, self).action_pos_order_cancel()
        if res:
            if self.account_move.journal_id.l10n_pe_is_dte:
                self.account_move.l10n_pe_dte_action_cancel()
                self.write({'cancel':True})
            else:
                self.account_move.button_cancel()
        return res
