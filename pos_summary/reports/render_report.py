from odoo import models, api, _
from datetime import datetime

import logging
log = logging.getLogger(__name__)


class SessionArchingReport(models.AbstractModel):
	_name = 'report.pos_summary.report_session_arching_view'

	@api.model
	def _get_report_values(self, docids, data=None):
		session_ids = self.env['pos.session'].search([('id', 'in', docids)])
		fecha_inicio = None
		fecha_cierre = None
		total_gastos = 0
		gastos = []
		for rec in session_ids:
			if rec.start_at != False:
				fecha_inicio = session_ids.get_datetime(rec.start_at)
			if rec.stop_at != False:
				fecha_cierre = session_ids.get_datetime(rec.stop_at)
			for order in rec.order_ids:
				if order.amount_total < 0:
					pasa = False
					for line in order.lines:
						if line.product_id.name == _('GASTOS VARIOS'):
							pasa = True
					if pasa:
						total_gastos = total_gastos + (-order.amount_total)
						gastos.append({
								'amount': -order.amount_total,
								'descr': line.note
							})

			for statement_line in rec.statement_ids:
				if statement_line.journal_id.type=='cash':
					for line in statement_line.line_ids:
						if line.amount<0 and not line.pos_statement_id:
							total_gastos = total_gastos + (-line.amount)
							gastos.append({
								'amount': -line.amount,
								'descr': line.name
								})

		return {
			'doc_ids': docids,
			'docs': self,
			'data': {
				'session_ids': session_ids,
				'gastos': gastos,
				'total_gastos': total_gastos,
				'fecha_inicio': fecha_inicio if fecha_inicio != None else '-',
				'fecha_cierre': fecha_cierre if fecha_cierre != None else '-'
			}
		}
