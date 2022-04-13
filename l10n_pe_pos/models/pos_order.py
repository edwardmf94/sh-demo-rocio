# -*- coding: utf-8 -*-
from odoo import api,fields, models
#import logging
#log = logging.getLogger(__name__)

class PosOrder(models.Model):
	_inherit = 'pos.order'

	custom_journal_id = fields.Many2one('account.journal',string='Diario Factura - Integracion')
	sequence_id = fields.Many2one('ir.sequence', string='Invoice Sequence', readonly=True)
	cancel = fields.Boolean(string='Anulado', default=False)

	#Para nota de credito
	refund_invoice_id = fields.Many2one('account.move', string='Factura Credito relacionada', readonly=True)
	refund_invoice_type = fields.Char(string='Tipo de Nota de Credito', readonly=True)
	#refund_invoice_type = fields.Many2one('reason.cancellation.credit.debit',string='Tipo de Nota de Credito', readonly=True)

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder, self)._order_fields(ui_order)
		if ui_order.get('custom_journal_id', False):
			res['custom_journal_id'] = ui_order.get('custom_journal_id')
		res['sequence_id'] = ui_order.get('sale_journal', False)
		res['refund_invoice_id'] = ui_order.get('refund_invoice_id', False)
		res['refund_invoice_type'] = ui_order.get('credit_note_type', False)
		return res

	def _prepare_invoice_vals(self):
		res = super(PosOrder, self)._prepare_invoice_vals()
		if self.custom_journal_id:
			res['journal_id'] = self.custom_journal_id.id
		if self.sequence_id:
			res['l10n_latam_document_type_id'] = self.sequence_id.l10n_latam_document_type_id
		if self.refund_invoice_id:
			res['l10n_pe_dte_credit_note_type'] = self.refund_invoice_type
			res['l10n_pe_dte_rectification_ref_type'] = self.sequence_id.l10n_latam_document_type_id.code
			res['l10n_pe_dte_rectification_ref_number'] = self.refund_invoice_id.name
		return res

	@api.model
	def get_print(self, order_id):
		result = super(PosOrder, self).get_print(order_id)
		order = self.browse(order_id)
		credit_note_type = False
		credit_note_origin = False
		document_type = False
		total_without_tax = 0
		amount_exonerated = 0
		amount_free = 0
		amount_igv = 0
		qr_string = ''
		if order.account_move:
			if order.sequence_id.l10n_latam_document_type_id.code == '07':
				credit_note_type = order.refund_invoice_type
				credit_note_origin = order.account_move.invoice_origin
			document_type = order.sequence_id.l10n_latam_document_type_id.code
			total_without_tax = order.account_move.l10n_pe_dte_amount_subtotal
			amount_exonerated = order.account_move.l10n_pe_dte_amount_exonerated
			amount_free = order.account_move.l10n_pe_dte_amount_free
			amount_igv = order.account_move.l10n_pe_dte_amount_igv
			qr_string = order.account_move._get_l10n_pe_dte_qrcode()
		result['document_type'] = document_type
		result['credit_note_type'] = credit_note_type
		result['credit_note_origin'] = credit_note_origin
		result['amount_subtotal'] = total_without_tax
		result['amount_exonerated'] = amount_exonerated
		result['amount_free'] = amount_free
		result['amount_igv'] = amount_igv
		result['qr_string'] = qr_string
		return result

	def action_cancel_invoice(self, account_move):
		pass

	@api.model
	def btnCancel(self, order_id, session_id):
		pos_order = self.env['pos.order']
		account_invoice = self.env['account.move']
		order = pos_order.browse(order_id)
		if order.cancel == False:
			if order.account_move:
				invoice = order.account_move
				if order.account_move.state == 'posted':
					#order.account_move.button_draft()
					#order.account_move.button_cancel()
					order.action_cancel_invoice(order.account_move)
					order.cancel = True
					order.account_move.invoice_payment_state = 'not_paid'
					if len(order.payment_ids)>0:
						refund = order.refund()
						refund_id = pos_order.browse(refund.get('res_id'))
						data_payments = {}
						for payment in order.payment_ids:
							data_payments = {
								'amount': payment.amount * -1 or 0.0,
								'payment_date': payment.payment_date,
								'name': 'RFN/%s' % ( payment.name if payment.name else ''),
								'payment_method_id': payment.payment_method_id.id,
								'pos_order_id': refund_id.id,
							}
							refund_id.add_payment(data_payments)
						refund_id.action_pos_order_paid()
						return {
							'rpta': 'PAGOS ELIMINADOS Y FACTURA ANULADA CORRECTAMENTE',
							'refund': {
								'id': refund.get('res_id'),
								'name': refund.get('name')
							}
						}
					else:
						refund = order.refund()
						refund_id = pos_order.browse(refund.get('res_id'))
						refund_id.action_pos_order_paid()
						return {
							'rpta': 'COMPROBANTE ANULADO CORRECTAMENTE',
							'refund': {
								'id': refund.get('id'),
								'name': refund.get('name')
							}
						}
				else:
					order.account_move.unlink()
					order.cancel = True
					refund = order.refund()
					return {
						'rpta': 'DEVOLUCION DE ORDEN REALIZADA CON EXITO',
						'refund': {
								'id': refund.get('res_id'),
								'name': refund.get('name')
							}
					}
			else:
				refund = order.refund()
				return {
					'rpta': 'ANULACION SIN FACTURA REALIZADA CORRECTAMENTE.',
					'refund': {
						'id': refund.get('res_id'),
						'name': refund.get('name')
					}
				}
		else:
			return {
					'rpta': '¡¡¡ LA FACTURA YA FUE ANULADA ANTERIORMENTE !!!',
					'refund': False
				}