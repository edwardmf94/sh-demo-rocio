# -*- coding: utf-8 -*-
from collections import defaultdict
from odoo import api,fields, models
import logging
log = logging.getLogger(__name__)

class PosSession(models.Model):
    _inherit = 'pos.session'

    def _accumulate_amounts(self, data):
        res = super(PosSession, self)._accumulate_amounts(data)
        amounts = lambda: {'amount': 0.0, 'amount_converted': 0.0}
        invoice_receivables = defaultdict(amounts)
        for order in self.order_ids:
            if order.is_invoiced:
                #key = order.partner_id
                key = order.id
                invoice_receivables[key] = self._update_amounts(invoice_receivables[key], {'amount': order._get_amount_receivable()}, order.date_order)
                extra_data = order._invoice_receivables_extra_fields()
                invoice_receivables[key].update(extra_data)
        res['invoice_receivables'] = invoice_receivables
        return res


    def _create_invoice_receivable_lines(self, data):
        # OVERRIDE METHOD FROM THE NATIVE ADDON
        MoveLine = data.get('MoveLine')
        invoice_receivables = data.get('invoice_receivables')
        invoice_receivable_vals = defaultdict(list)
        invoice_receivable_lines = {}
        extra_vals_by_order_id = {}
        for order_id, amounts in invoice_receivables.items():
            commercial_partner = amounts['partner'].commercial_partner_id
            account_id = commercial_partner.property_account_receivable_id.id
            invoice_receivable_vals[commercial_partner].append(self._get_invoice_receivable_vals(account_id, amounts['amount'], amounts['amount_converted'], partner=commercial_partner))
        for order_id_key, vals in invoice_receivable_vals.items():
            account_id = commercial_partner.property_account_receivable_id.id
            #account_id = vals.get('account_id')
            receivable_lines = MoveLine.create(vals)
            for receivable_line in receivable_lines:
                if (not receivable_line.reconciled):
                    if account_id not in invoice_receivable_lines:
                        invoice_receivable_lines[account_id] = receivable_line
                    else:
                        invoice_receivable_lines[account_id] |= receivable_line

        data.update({'invoice_receivable_lines': invoice_receivable_lines})
        return data