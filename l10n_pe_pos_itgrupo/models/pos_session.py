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
        order_account_move_receivable_lines = defaultdict(lambda: self.env['account.move.line'])
        for order in self.order_ids:
            if order.is_invoiced:
                #key = order.partner_id
                key = order.account_move.id
                if order.has_credit == False:
                    invoice_receivables[key] = self._update_amounts(invoice_receivables[key], {'amount': order._get_amount_receivable()}, order.date_order)
                    invoice_receivables[key].update({
                        'partner':order.partner_id,
                        'type_document_id': order.account_move.type_document_id.id,
                        'nro_comp': order.account_move.ref
                    })
                    # side loop to gather receivable lines by account for reconciliation
                    for move_line in order.account_move.line_ids.filtered(lambda aml: aml.account_id.internal_type == 'receivable' and not aml.reconciled):
                        order_account_move_receivable_lines[move_line.account_id.id] |= move_line
                else:
                    if order._get_amount_credit() > 0:
                        invoice_receivables[key] = self._update_amounts(invoice_receivables[key], {'amount': order._get_amount_credit()}, order.date_order)
                        # side loop to gather receivable lines by account for reconciliation
                        for move_line in order.account_move.line_ids.filtered(lambda aml: aml.account_id.internal_type == 'receivable' and not aml.reconciled):
                            order_account_move_receivable_lines[move_line.account_id.id] |= move_line

        res.update({
			'invoice_receivables': invoice_receivables,
			'order_account_move_receivable_lines': order_account_move_receivable_lines,
		})
        return res


    def _create_invoice_receivable_lines(self, data):
        # OVERRIDE METHOD FROM THE NATIVE ADDON
        MoveLine = data.get('MoveLine')
        invoice_receivables = data.get('invoice_receivables')
        invoice_receivable_vals = defaultdict(list)
        invoice_receivable_lines = {}
        for move_id, amounts in invoice_receivables.items():
            log.info('--------------------')
            log.info(amounts)
            if amounts.get('partner', False):
                commercial_partner = amounts['partner'].commercial_partner_id
                #account_id = move_id
                account_id = commercial_partner.property_account_receivable_id.id
                get_invoice_receivable_vals = self._get_invoice_receivable_vals(account_id, amounts['amount'], amounts['amount_converted'], partner=commercial_partner)
                get_invoice_receivable_vals.update({
                    'type_document_id': amounts.get('type_document_id', False),
                    'nro_comp': amounts.get('nro_comp', False),
                })
                invoice_receivable_vals[commercial_partner].append(get_invoice_receivable_vals)
        for commercial_partner, vals in invoice_receivable_vals.items():
            account_id = commercial_partner.property_account_receivable_id.id
            #log.info('valida vals******************')
            #log.info(vals)
            #account_id = vals[0].get('account_id', commercial_partner.property_account_receivable_id.id)
            receivable_lines = MoveLine.create(vals)
            for receivable_line in receivable_lines:
                if (not receivable_line.reconciled):
                    if account_id not in invoice_receivable_lines:
                        invoice_receivable_lines[account_id] = receivable_line
                    else:
                        invoice_receivable_lines[account_id] |= receivable_line

        data.update({'invoice_receivable_lines': invoice_receivable_lines})
        return data

    def _get_split_receivable_vals(self, payment, amount, amount_converted):
        partial_vals = {
            'account_id': payment.payment_method_id.receivable_account_id.id,
            'move_id': self.move_id.id,
            'partner_id': self.env["res.partner"]._find_accounting_partner(payment.partner_id).id,
            'name': '%s - %s' % (self.name, payment.payment_method_id.name),
        }
        if payment.pos_order_id:
            partial_vals['type_document_id'] = payment.pos_order_id.account_move.type_document_id.id
            partial_vals['nro_comp'] = payment.pos_order_id.account_move.ref
        return self._debit_amounts(partial_vals, amount, amount_converted)