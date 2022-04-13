# -*- coding: utf-8 -*-
from odoo import api,fields, models
#import logging
#log = logging.getLogger(__name__)

class IrSequence(models.Model):
    _inherit = 'ir.sequence'

    @api.model
    def load_pos_real_sequences(self, data):
        if data.get('sequence_ids', False):
            ids = ",".join([str(i) for i in data.get('sequence_ids')])
            sql_sequence = """
                SELECT sq.id sequence_id, sq.prefix, sq.padding, sq.name, sq.number_increment, max(am.name)
                FROM account_move am
                INNER JOIN it_invoice_serie its ON its.id = am.serie_id
                INNER JOIN ir_sequence sq ON sq.id = its.sequence_id
                WHERE am.type IN ('out_invoice', 'out_refund') AND its.id IN (%s) AND am.state IN ('posted','cancel')
                GROUP BY sq.id""" % ids
            self.env.cr.execute(sql_sequence)
            result = self.env.cr.dictfetchall()
            return result
        else:
            return []
