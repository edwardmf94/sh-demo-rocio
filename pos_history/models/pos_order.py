# -*- coding: utf-8 -*-
from odoo import models, fields, api

import logging
log = logging.getLogger(__name__)


class PosOrder(models.Model):
	_inherit = "pos.order"

	account_move_name = fields.Char(string='Número de Factura', related='account_move.name')

	@api.model
	def get_print(self, order_id):
		order = self.browse(order_id)
		orderlines = []
		amount_total_gift = 0
		for line in order.lines:
			uom_id = line.product_id.uom_id.id
			uom_name = line.product_id.uom_id.name
			if 'uom_id' in line:
				uom_id = line.uom_id.id
				uom_name = line.uom_id.with_context(lang='es_PE').name
			product_name = line.product_id.name
			if line.product_id.name:
				product_name = line.product_id.name
			price_subtotal_incl = line.price_subtotal_incl
			orderlines.append({
				'product_id': line.product_id.id,
				'product_name': product_name,
				'product_default_code': line.product_id.default_code,
				'product_name_wrapped': [line.product_id.name],
				"product_description": False,
				"product_description_sale": False,
				'unit_id': uom_id,
				'unit_name': uom_name,
				'quantity': line.qty,
				'qty': line.qty,
				'discount': line.discount,
				'price_without_tax': line.price_subtotal,
				'price_with_tax': price_subtotal_incl,
				'price_unit': line.price_unit,
				'tax': line.price_subtotal_incl - line.price_subtotal,
				'pack_lot_ids': []
			})
		payments = []
		for line in order.payment_ids:
			payments.append({
				'name': line.payment_method_id.name,
				'amount': line.amount,
			})
		invoice_payment_term_id = 1
		payment_term = 'CONTADO'
		if order.account_move.invoice_payment_term_id:
			invoice_payment_term_id = order.account_move.invoice_payment_term_id.id
			payment_term = order.account_move.invoice_payment_term_id.name
		credit_note_type = False
		credit_note_origin = False
		Session = self.env['pos.session']
		jsonOrder = {
			'client': order.partner_id.name,
			'client_id': order.partner_id.id,
			'client_vat': order.partner_id.vat,
			'client_doc_type': order.partner_id.l10n_latam_identification_type_id.name,
			'client_street': order.partner_id.street,
			'orderlines': orderlines,
			'paymentlines': payments,
			'subtotal': order.amount_total,
			'change': order.amount_return,
			'cashier_id': order.user_id.id,
			'cashier': order.user_id.name,
			'name': order.pos_reference,
			'account_move': order.account_move.id,
			'invoice_name': order.account_move.name,
			'date_order': Session.get_datetime(order.date_order),
			'invoice_date': order.account_move.invoice_date,
			'order_date': Session.get_datetime(order.date_order),
			'invoice_payment_term_id': invoice_payment_term_id,
			'custom_journal_id':order.account_move.journal_id.id,
			'payment_term': payment_term,
			'credit_note_type': credit_note_type,
			'credit_note_origin': credit_note_origin,
			"precision": {"price": 2, "money": 2, "quantity": 3},
			"currency": {"id": 163, "rounding": 0.01, "position": "before", "rate": 1, "name": "PEN", "symbol": "S/", "decimals": 2},
			"header": "",
			"footer": ""
		}
		return jsonOrder
