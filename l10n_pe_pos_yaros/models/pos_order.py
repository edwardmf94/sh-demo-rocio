# -*- coding: utf-8 -*-
from odoo import api, fields, models
import logging
log = logging.getLogger(__name__)

class PosOrder(models.Model):
    _inherit = 'pos.order'

    yaros_prefix_val = fields.Char(string='Serie Factura')
    yaros_suffix_val = fields.Char(string='Numero Factura')

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res['yaros_prefix_val'] = ui_order.get('yaros_prefix_val', False)
        res['yaros_suffix_val'] = ui_order.get('yaros_suffix_val', False)
        return res

    def _prepare_invoice_vals(self):
        res = super(PosOrder, self)._prepare_invoice_vals()
        if self.yaros_prefix_val:
            res['prefix_val'] = self.yaros_prefix_val
        if self.yaros_suffix_val:
            res['suffix_val'] = self.yaros_suffix_val
        if self.refund_invoice_id:
            origin_move = self.refund_invoice_id
            res['l10n_pe_dte_rectification_ref_type'] = self.env['l10n_latam.document.type'].search([('code','=',origin_move.journal_id.invoice_document_type_id.code)])[0].id
            log.info(self.refund_invoice_type)
            log.info(self.custom_journal_id.invoice_document_type_id.id)
            reason_cancellation_id = self.env['reason.cancellation.credit.debit'].search([('code','=', self.refund_invoice_type),('inv_document_type_id','=',self.custom_journal_id.invoice_document_type_id.id)])
            log.info(reason_cancellation_id)
            if reason_cancellation_id:
                res['reason_cancellation_id'] = self.env['reason.cancellation.credit.debit'].search([('code','=', self.refund_invoice_type),('inv_document_type_id','=',self.custom_journal_id.invoice_document_type_id.id)])[0].id
            else:
                res['reason_cancellation_id'] = 1
        return res

    @api.model
    def get_print(self, order_id):
        result = super(PosOrder, self).get_print(order_id)
        order = self.browse(order_id)
        if order.account_move:
            result['document_type'] = order.account_move.journal_id.invoice_document_type_id.code
            result['prefix_val'] = order.account_move.prefix_val
            result['suffix_val'] = order.account_move.suffix_val
        return result

    def action_pos_order_invoice(self):
        res = super(PosOrder, self).action_pos_order_invoice()
        if res.get('res_id', False):
            for order in self:
                if order.account_move and order.offline_invoice_number_int:
                    max_seq = max(order.account_move.journal_id.sequence_id.number_next_actual, int(order.offline_invoice_number_int)+1)
                    order.account_move.journal_id.write({'sequence_number_next':max_seq})
        return res