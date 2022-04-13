# -*- coding: utf-8 -*-
from odoo import models

import logging
log = logging.getLogger(__name__)

class AccountMove(models.Model):
    _inherit = "account.move"

    def _l10n_pe_prepare_dte(self):
        res = super(AccountMove, self)._l10n_pe_prepare_dte()
        res['dte_serial'] = self.prefix_val
        res['dte_number'] = self.suffix_val
        res['invoice_type_code'] = self.journal_id.invoice_document_type_id.code
        if res['invoice_type_code']=='07' or res['invoice_type_code']=='08':
            if res['invoice_type_code']=='07':
                res['credit_note_type'] = self.l10n_pe_dte_credit_note_type
            if res['invoice_type_code']=='08':
                res['debit_note_type'] = self.l10n_pe_dte_debit_note_type
            res['rectification_ref_type'] = self.l10n_pe_dte_rectification_ref_type.code
            ref = self.l10n_pe_dte_rectification_ref_number.split('-')
            if len(ref)==1:
                res['rectification_ref_number'] = '%s-%s' % (self.l10n_pe_dte_rectification_ref_number[:4], self.l10n_pe_dte_rectification_ref_number[4:])
            else:
                res['rectification_ref_number'] = self.l10n_pe_dte_rectification_ref_number
        return res

    def _l10n_pe_edi_get_extra_report_values(self):
        res = super(AccountMove, self)._l10n_pe_edi_get_extra_report_values()
        self.ensure_one()
        invoice_report_name = ''
        if self.journal_id.invoice_document_type_id.code=='01':
            invoice_report_name = 'Factura Electronica'
        elif self.journal_id.invoice_document_type_id.code=='03':
            invoice_report_name = 'Boleta Electronica'
        elif self.journal_id.invoice_document_type_id.code=='07':
            invoice_report_name = 'Nota de credito Electronica'
        elif self.journal_id.invoice_document_type_id.code=='08':
            invoice_report_name = 'Nota de debito Electronica'
        return {
            "invoice_report_name": invoice_report_name,
        }