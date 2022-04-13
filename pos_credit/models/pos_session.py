# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError
from collections import defaultdict

import logging
log = logging.getLogger(__name__)

class PosSession(models.Model):
	_inherit = 'pos.session'

	@api.model
	def get_summary_credit(self, session_id):
		res = self.get_summary(session_id)
		values = res['data']
		session = self.browse(session_id)
		#se sobreescribe sales_by_journal
		sales_by_journal = []
		for statement in session.statement_ids:
			sales_by_journal.append({
				'journal_id':statement.journal_id.id,
				'name':statement.journal_id.name_get()[0][1],
				'amount':statement.balance_end_real,
				'count_transactions':len(statement.line_ids)
			})
		values['sales_by_journal'] = sales_by_journal
		res['data'] = values
		return res

	@api.model
	def get_collection_credit(self, session_id):
		result = {
			'contado': [],
			'credito': [],
		}
		self.env.cr.execute("""
			SELECT po.has_credit, ajd.code type_invoice, ai.name number, COALESCE(rp.name, '--') partner_name, COALESCE(rp.vat, '--') vat, 
				ai.amount_total, ai.amount_total - ai.amount_residual paid_amount
			FROM pos_order po
			INNER JOIN account_move ai ON ai.id = po.account_move
			INNER JOIN l10n_latam_document_type AS ajd ON ajd.id = ai.l10n_latam_document_type_id
			LEFT JOIN res_partner rp ON rp.id = po.partner_id
			WHERE po.session_id = %s AND po.cancel IS False
			ORDER BY ajd.code,ai.name""" % (session_id))
		order_ids = self.env.cr.dictfetchall()
		for order in order_ids:
			if order['has_credit']:
				result['credito'].append(order)
			else:
				result['contado'].append(order)
		return result

	def _accumulate_amounts(self, data):
		new_data = super(PosSession,self)._accumulate_amounts(data)
		amounts = lambda: {'amount': 0.0, 'amount_converted': 0.0}
		invoice_receivables = defaultdict(amounts)
		order_account_move_receivable_lines = defaultdict(lambda: self.env['account.move.line'])
		for order in self.order_ids:
			if order.is_invoiced:
				# Combine invoice receivable lines
				key = order.partner_id
				if order.has_credit == False:
					invoice_receivables[key] = self._update_amounts(invoice_receivables[key], {'amount': order._get_amount_receivable()}, order.date_order)
					# side loop to gather receivable lines by account for reconciliation
					for move_line in order.account_move.line_ids.filtered(lambda aml: aml.account_id.internal_type == 'receivable' and not aml.reconciled):
						order_account_move_receivable_lines[move_line.account_id.id] |= move_line
				else:
					if order._get_amount_credit() > 0:
						invoice_receivables[key] = self._update_amounts(invoice_receivables[key], {'amount': order._get_amount_credit()}, order.date_order)
						# side loop to gather receivable lines by account for reconciliation
						for move_line in order.account_move.line_ids.filtered(lambda aml: aml.account_id.internal_type == 'receivable' and not aml.reconciled):
							order_account_move_receivable_lines[move_line.account_id.id] |= move_line
		new_data.update({
			'invoice_receivables': invoice_receivables,
			'order_account_move_receivable_lines': order_account_move_receivable_lines,
		})
		return new_data
