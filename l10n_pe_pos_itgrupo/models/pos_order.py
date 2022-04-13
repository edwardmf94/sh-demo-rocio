# -*- coding: utf-8 -*-
from odoo import api,fields, models
import logging
log = logging.getLogger(__name__)

class PosOrder(models.Model):
	_inherit = 'pos.order'

	itserie_id = fields.Many2one('it.invoice.serie', string='Serie Comp.', readonly=True)
	type_document_id = fields.Many2one('einvoice.catalog.01', string='Tipo Comp.', readonly=True)

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder, self)._order_fields(ui_order)
		del res['sequence_id']
		res['itserie_id'] = ui_order.get('sale_journal', False)
		res['type_document_id'] = ui_order.get('type_document_id', False)
		return res

	def _prepare_invoice_vals(self):
		res = super(PosOrder, self)._prepare_invoice_vals()
		if self.itserie_id:
			res['serie_id'] = self.itserie_id.id
			res['type_document_id'] = self.type_document_id.id
			res['glosa'] = 'VENTA TERMIANL PUNTO DE VENTA'
			res.pop('name')
			if self.refund_invoice_id:
				origin_move = self.refund_invoice_id
				res['doc_invoice_relac'] = [(0, 0, {
						'type_document_id': origin_move.type_document_id.id,
						'date': origin_move.invoice_date,
						'nro_comprobante': origin_move.ref,
						'amount_currency': origin_move.amount_total if origin_move.currency_id.name != 'PEN' else 0,
						'amount': abs(origin_move.amount_total_signed),
						'bas_amount': abs(origin_move.amount_untaxed),
						'tax_amount': abs(origin_move.amount_total_signed - origin_move.amount_untaxed)
					})]
				res['credit_note_type_id'] = self.env['einvoice.catalog.09'].search([('code','=', self.refund_invoice_type or '01')])[0].id
		return res

	def _prepare_invoice_line(self, order_line):
		res = super(PosOrder, self)._prepare_invoice_line(order_line)
		res['location_id'] = order_line.order_id.picking_type_id.default_location_src_id.id
		return res

	def action_pos_order_invoice(self):
		res = super(PosOrder, self).action_pos_order_invoice()
		type_operation_sunat = self.env['type.operation.kardex'].search([('code','=','01')])
		if res.get('res_id', False):
			for order in self:
				if order.account_move:
					max_seq = max(order.account_move.serie_id.sequence_id.number_next_actual, int(order.offline_invoice_number_int)+1)
					order.account_move.serie_id.sequence_id.sudo().write({'number_next_actual':max_seq})
					_pick = {
						'invoice_id':order.account_move.id,
						'type_operation_sunat_id':type_operation_sunat[0].id
					}
					_move = {'kardex_date':order.picking_id.kardex_date}
					if self.refund_invoice_id:
						picking = self.env['stock.picking'].search([('invoice_id','=',self.refund_invoice_id.id)])
						if picking:
							_pick['origin'] = picking[0].name
							_move['origin'] = picking[0].name
					order.picking_id.sudo().write(_pick)
					for move_line in order.picking_id.move_lines:
						move_line.sudo().write(_move)
		return res

	def create_picking(self):
		res = super(PosOrder, self).create_picking()
		Picking = self.env['stock.picking']
		type_operation_sunat = self.env['type.operation.kardex'].search([('code','=','01')])
		if res and type_operation_sunat:
			for order in self:
				if order.picking_id:
					order.picking_id.write({'type_operation_sunat_id':type_operation_sunat[0].id})
		return res

	@api.model
	def get_print(self, order_id):
		result = super(PosOrder, self).get_print(order_id)
		log.info('--------------------------------------------------')
		log.info(result)
		order = self.browse(order_id)
		if order.account_move:
			#if order.sequence_id.l10n_latam_document_type_id.code == '07':
			#	credit_note_type = order.refund_invoice_type
			#	credit_note_origin = order.account_move.invoice_origin
			result['account_move_ref'] = order.account_move.ref
			result['document_type'] = order.account_move.type_document_id.code
			result['invoice_name'] = order.account_move.ref
			result['account_move_name'] = order.account_move.ref
			#qr_string = order.account_move._get_l10n_pe_dte_qrcode()
		log.info('zzzzzzzzzzzzzzzzzzzzzzzzz')
		log.info(result)
		return result

	@api.model
	def btnCancelIt(self, order_id, session_id):
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
						return {
							'rpta': 'EL PEDIDO TIENE UNA FACTURA CON PAGOS ASOCIADOS, ES NECESARIO EMITIR UNA NOTA DE CREDITO',
							'refund': False
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
					return {
						'rpta': 'EL PEDIDO TIENE UN ASIENTO CONTABLE NO PUBLICADO',
						'refund': False
					}
			else:
				return {
					'rpta': 'EL PEDIDO NO TIENE UN ASIENTO CONTABLE A ANULAR',
					'refund': False
				}
		else:
			return {
					'rpta': '¡¡¡ LA FACTURA YA FUE ANULADA ANTERIORMENTE !!!',
					'refund': False
				}