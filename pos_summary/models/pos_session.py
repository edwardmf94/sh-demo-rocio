from odoo import models, fields, api
from datetime import datetime, timedelta
import pytz

import logging
log = logging.getLogger(__name__)

class PosSession(models.Model):
	_inherit = 'pos.session'

	def format_date_timezone(self, date):
		user_tz = self.env.user.tz or pytz.utc
		local = pytz.timezone(user_tz)
		new_date = pytz.utc.localize(date).astimezone(local)
		return new_date

	def get_datetime(self, date=None):
		fmt = '%d-%m-%Y %H:%M:%S'
		db_tz = pytz.timezone('GMT')
		db_date = None
		if date == None:
			db_date = db_tz.localize(datetime.now())
		else:
			db_date = db_tz.localize(date)
		user_tz = pytz.timezone(self.env.user.tz)
		user_dt = db_date.astimezone(user_tz)
		return user_dt.strftime(fmt)

	@api.model
	def get_summary(self, session_id):
		rpta = {
			'status': 'error',
			'message': 'There was an error with the petition'
		}
		user_currency = self.env.company.currency_id
		pos_session = self.env['pos.session'].browse(session_id)
		values = {
			'config_id': pos_session.config_id.id,
			'name': pos_session.name,
			'user_id': pos_session.user_id.name,
			'start_at': datetime.strftime(self.format_date_timezone(pos_session.start_at), '%Y-%m-%d %H:%M:%S'),
			'stop_at': datetime.strftime(self.format_date_timezone(pos_session.stop_at), '%Y-%m-%d %H:%M:%S') if pos_session.stop_at else pos_session.stop_at,
			'total': pos_session.total_payments_amount,
			'total_tax': 0,
			'total_grav': 0,
			'order_qty': pos_session.order_count,
			'count_transactions':0,
			'count_cancel':0,
			'by_sale_journal':[]
		}
		order_ids = self.env['pos.order'].search([('session_id', '=', session_id)], order='id asc')
		product_ids = []
		products = []
		refund_by_journal = {}
		sales_by_sale_journal = {}
		sales_by_sale_journal[0] = {
			'journal_id': 0,
			'name': "Sin Factura",
			'count_transactions':0,
			'amount_untaxed':0,
			'amount_tax':0,
			'amount_total':0
		}
		sales_by_product_category = {}
		sales_summary = {
			'count_transactions':0,
			'count_cancel':0,
			'amount_untaxed':0,
			'amount_tax':0,
			'amount_total':0
		}

		module_yaros = self.env['ir.module.module'].sudo().search([('name', '=', 'l10n_pe_edi_yaros'), ('state','=','installed')])
		module_itgrupo = self.env['ir.module.module'].sudo().search([('name', '=', 'l10n_pe_edi_itgrupo'), ('state','=','installed')])

		for order in order_ids:
			values['count_transactions']+=1
			sales_summary['count_transactions']+=1
			if order.account_move and not order.refund_invoice_id:
				omove = order.account_move
				indice = 0
				if module_yaros:
					indice = omove.journal_id.id
				elif module_itgrupo:
					indice = omove.type_document_id.id
				else:
					indice = omove.l10n_latam_document_type_id.id

				if indice not in sales_by_sale_journal:
					sales_by_sale_journal[indice] = {
						'journal_id': indice,
						'name': omove.journal_id.name_get()[0][1],
						'count_transactions':0,
						'amount_untaxed':0,
						'amount_tax':0,
						'amount_total':0
					}
				if not order.cancel:
					sales_by_sale_journal[indice]['count_transactions']+=1
					sales_by_sale_journal[indice]['amount_untaxed']+=omove.amount_untaxed
					sales_by_sale_journal[indice]['amount_tax']+=omove.amount_tax
					sales_by_sale_journal[indice]['amount_total']+=omove.amount_total
				sales_summary['amount_untaxed']+=omove.amount_untaxed
				sales_summary['amount_tax']+=omove.amount_tax
				sales_summary['amount_total']+=omove.amount_total
				values['total_grav']+=omove.amount_untaxed
				values['total_tax']+=omove.amount_tax
			elif order.refund_invoice_id:
				omove = order.account_move
				indice = 0
				if module_yaros:
					indice = omove.journal_id.id
				elif module_itgrupo:
					indice = omove.type_document_id.id
				else:
					indice = omove.l10n_latam_document_type_id.id

				if indice not in refund_by_journal:
					refund_by_journal[indice] = {
						'journal_id': indice,
						'name': omove.journal_id.name_get()[0][1] if omove.journal_id.name_get() else 'NC-S/N',
						'count_transactions':0,
						'amount_untaxed':0,
						'amount_tax':0,
						'amount_total':0
					}
				refund_by_journal[indice]['count_transactions']+=1
				refund_by_journal[indice]['amount_untaxed']+=omove.amount_untaxed_signed
				refund_by_journal[indice]['amount_tax']+=omove.amount_tax_signed
				refund_by_journal[indice]['amount_total']+=omove.amount_total_signed
				sales_summary['amount_untaxed']+=omove.amount_untaxed_signed
				sales_summary['amount_tax']+=omove.amount_tax_signed
				sales_summary['amount_total']+=omove.amount_total_signed
				values['total_grav']+=omove.amount_untaxed_signed
				values['total_tax']+=omove.amount_tax_signed
			else:
				untaxed = order.amount_total-order.amount_tax
				if order.cancel:
					values['count_cancel']+=1
				else:
					sales_by_sale_journal[0]['count_transactions']+=1
					sales_by_sale_journal[0]['amount_untaxed']+=untaxed
					sales_by_sale_journal[0]['amount_tax']+=order.amount_tax
					sales_by_sale_journal[0]['amount_total']+=order.amount_total
				sales_summary['amount_untaxed']+=untaxed
				sales_summary['amount_tax']+=order.amount_tax
				sales_summary['amount_total']+=order.amount_total
				values['total_grav']+=untaxed
				values['total_tax']+=order.amount_tax

		values['sales_summary'] = []
		for key, val in sales_summary.items():
			values['sales_summary'].append(val)

		values['sales_by_sale_journal'] = []
		for key, val in sales_by_sale_journal.items():
			if val['count_transactions'] > 0:
				values['sales_by_sale_journal'].append(val)

		values['refund_by_journal'] = []
		for key, val in refund_by_journal.items():
			values['refund_by_journal'].append(val)

		values['sales_by_product_category'] = []
		for key, val in sales_by_product_category.items():
			_products = []
			if val['products']!={}:
				for key_prod, val_prod in val['products'].items():
					_products.append(val_prod)
			val['products'] = _products
			values['sales_by_product_category'].append(val)
		vault_transactions = []
		values['vault_transactions'] = vault_transactions

		sales_by_journal = []
		self._cr.execute("""
			SELECT ppm.name payment_method_name, pp.payment_method_id, count(pp.id) count_transactions, sum(amount) amount
			FROM pos_payment pp
			LEFT JOIN pos_payment_method ppm ON ppm.id = pp.payment_method_id
			WHERE pp.session_id = %s
			GROUP BY ppm.name, pp.payment_method_id
			ORDER BY pp.payment_method_id ASC""" % (session_id) )
		docs = self._cr.dictfetchall()
		for docline in docs:
			amount= user_currency.round(docline['amount'])
			sales_by_journal.append({
				'journal_id':docline['payment_method_id'],
				'name':docline['payment_method_name'],
				'amount':amount,
				'count_transactions':docline['count_transactions'],
			})

		values['sales_by_journal'] = sales_by_journal
		rpta['status'] = 'success'
		rpta['data'] = values
		return rpta

	@api.model
	def get_info_session_day(self,pdv_id,day):
		session_ids = self.sudo().search([('config_id','=', pdv_id),
			('start_at','>=', day+' 00:00:01'),('start_at','<=', day+' 23:59:59')],order='id ASC')
		account = 0
		account_b = 0
		total_amount_journal = 0
		data = {
			'name':"",
			'day':day,
			'config_id':"",
			'info':"",
			'cashier':"",
			'cashiers':[],
			'sales_by_sale_journal': [],
			'sales_by_journal':[],
			'total_transaction_amount':"",
			'total_tax':0,
			'total_grav':0,
			'total':0,
			'count_transactions':0,
			}
		for session_id in session_ids:
			data['config_id'] = session_id.config_id.name
			if session_id.user_id.name not in data['cashiers']:
				data['cashiers'].append(str(session_id.user_id.name))
			summary = self.get_summary(session_id.id)
			data['count_transactions'] = summary['data'].get('count_transactions',0)
			data['total_tax'] = data['total_tax'] + summary['data']['total_tax']
			data['total_grav'] = data['total_grav'] + summary['data']['total_grav']
			data['total'] = data['total'] + summary['data']['total']
			for journal in summary['data']['sales_by_journal']:
				if account_b:
					for dxc in data['sales_by_journal']:
						validation_b = 1
						if dxc['name'] == journal['name']:
							dxc['count_transactions'] = dxc['count_transactions'] + journal['count_transactions']
							dxc['amount'] = dxc['amount'] + journal['amount']
							total_amount_journal = total_amount_journal + journal['amount']
							break
						else:
							validation_b = 0

					if not validation_b:
						data['sales_by_journal'].append({
							'name': str(journal['name']),
							'count_transactions': journal['count_transactions'],
							'amount': journal['amount']
						})
						total_amount_journal = total_amount_journal + journal['amount']
				if not account_b:
					account_b = 1
					data['sales_by_journal'].append({
						'name': str(journal['name']),
						'count_transactions': journal['count_transactions'],
						'amount': journal['amount']
					})
					total_amount_journal = total_amount_journal + journal['amount']
			for journal in summary['data']['sales_by_sale_journal']:
				journal_position = -1
				for position,item in enumerate(data['sales_by_sale_journal']):
					if item['journal_id'] == journal['journal_id']:
						journal_position = position
				if journal_position>=0:
					data['sales_by_sale_journal'][journal_position]['count_transactions'] += journal['count_transactions']
					data['sales_by_sale_journal'][journal_position]['amount_untaxed'] += journal['amount_untaxed']
					data['sales_by_sale_journal'][journal_position]['amount_tax'] += journal['amount_tax']
					data['sales_by_sale_journal'][journal_position]['amount_total'] += journal['amount_total']
				else:
					data['sales_by_sale_journal'].append({
						'journal_id': journal['journal_id'],
						'name': str(journal['name']),
						'count_transactions': journal['count_transactions'],
						'amount_untaxed': journal['amount_untaxed'],
						'amount_tax': journal['amount_tax'],
						'amount_total': journal['amount_total']
					})
			data['total_transaction_amount'] = str(total_amount_journal)
		return data
