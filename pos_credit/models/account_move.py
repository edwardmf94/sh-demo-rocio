# -*- coding: utf-8 -*-
from odoo import fields, models, api

#import logging
#log = logging.getLogger(__name__)

class AccountMove(models.Model):
    _inherit = 'account.move'

    def _compute_amount(self):
        super(AccountMove, self)._compute_amount()
        pos_invoices = self.filtered(lambda i: i.type in ['out_invoice', 'out_refund'] and i.pos_order_ids)
        for move in pos_invoices:
            if move.pos_order_ids[0].has_credit:
                move.invoice_payment_state = 'not_paid'
            else:
                move.invoice_payment_state = 'paid'
