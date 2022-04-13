# coding: utf-8

from odoo import models, _
from odoo.exceptions import UserError


class AccountMove(models.Model):
    _inherit = 'account.move'

    def generate_correlative_invoice(self):
        self.ensure_one()
        prefix = self.prefix_val
        code = self.suffix_val
        if self.name and self.name != '/':
            new_name = self.name
        else:
            obj_journal = self.journal_id
            obj_sequence = obj_journal.sequence_id
            if obj_sequence:
                if self and self.type in ['out_refund', 'in_refund'] and obj_journal.refund_sequence:
                    if not obj_journal.refund_sequence_id:
                        raise UserError(_('Please define a sequence for the credit notes'))
                    obj_sequence = obj_journal.refund_sequence_id
                elif self.type in ['out_invoice', 'out_refund']:
                    prefix, dummy = obj_sequence.with_context(
                        ir_sequence_date=self.invoice_date,
                        ir_sequence_date_range=self.invoice_date)._get_prefix_suffix()
                    padding = obj_sequence.padding
                    obj_sequence.sudo()._get_number_next_actual()
                    number_next_actual = obj_sequence.number_next_actual
                    suffix = obj_sequence.suffix or ''
                    code = ('%%0%sd' % padding % number_next_actual) + suffix
                date = self.invoice_date
                if self.type == 'in_invoice':
                    date = self.date or self.invoice_date
                new_name = obj_sequence.next_by_id(date)
            else:
                raise UserError(_('Please define a sequence on the journal.'))
        return prefix, code, new_name

    def post(self):
        for move in self:
            if move.name == '/':
                if move:
                    prefix, code, new_name = move.generate_correlative_invoice()
                    move.write({
                        'prefix_val': prefix,
                        'suffix_val': code,
                        'name': new_name
                    })
        return super(AccountMove, self).post()
