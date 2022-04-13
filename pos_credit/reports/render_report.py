from odoo import models, api
from datetime import datetime

import logging
log = logging.getLogger(__name__)


class SessionCollectionReport(models.AbstractModel):
    _name = 'report.pos_credit.report_session_collection_view'

    @api.model
    def _get_report_values(self, docids, data=None):
        session_ids = self.env['pos.session'].search([('id', 'in', docids)])
        cash_in = {}
        cash_out = {}
        fecha_inicio = {}
        fecha_cierre = {}
        for rec in session_ids:
            cash_in[rec.id] = []
            cash_out[rec.id] = []
            fecha_inicio[rec.id] = None
            fecha_cierre[rec.id] = None

            if rec.start_at != False:
                fecha_inicio[rec.id] = session_ids.get_datetime(rec.start_at)
            if rec.stop_at != False:
                fecha_cierre[rec.id] = session_ids.get_datetime(rec.stop_at)

            for statement_line in rec.statement_ids:
                if statement_line.journal_id.type=='cash':
                    for line in statement_line.line_ids:
                        if not line.pos_statement_id:
                            item = {
                                'partner': line.partner_id.name if line.partner_id else "",
                                'vat': line.partner_id.vat if line.partner_id else "",
                                'amount': line.amount,
                                'descr': line.name,
                            }
                            if line.amount < 0:
                                cash_out[rec.id].append(item)
                            if line.amount > 0:
                                cash_in[rec.id].append(item)

        return {
            'doc_ids': docids,
            'docs': self,
            'data': {
                'session_ids': session_ids,
                'cash_in': cash_in,
                'cash_out': cash_out,
                'fecha_inicio': fecha_inicio,
                'fecha_cierre': fecha_cierre,
            }
        }
