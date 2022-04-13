# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError

import logging
log = logging.getLogger(__name__)


class Session(models.Model):
	_inherit = 'pos.session'

	@api.model
	def get_info_partner_has_credit(self):
		self.env.cr.execute("""
			SELECT rp.vat partner_vat, rp.name partner_name, payment.invoice_name, payment.amount_total-payment.amount_paid amount_total
			FROM (
				SELECT po.id order_id, po.partner_id, ai.name invoice_name, COALESCE(SUM(pp.amount),0) amount_paid, po.amount_total
				FROM pos_order po
				LEFT JOIN pos_payment pp ON pp.pos_order_id = po.id
				LEFT JOIN account_move ai ON po.account_move = ai.id
				WHERE po.session_id = %s AND po.has_credit = True
				GROUP BY po.id, po.partner_id, ai.name, po.amount_total
			) payment
			LEFT JOIN res_partner rp ON payment.partner_id = rp.id""" % self.id)
		result = self.env.cr.dictfetchall()
		return result

	@api.model
	def get_summary(self, session_id):
		#agrega detalle de credito dentro del pdv
		res = super(Session,self).get_summary(session_id)
		values = res['data']
		session = self.browse(session_id)
		values['credits'] = session.get_info_partner_has_credit()
		res['data'] = values
		return res
