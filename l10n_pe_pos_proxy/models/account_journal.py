# -*- coding: utf-8 -*-
from odoo import api,fields, models

import logging
log = logging.getLogger(__name__)

class AccountJournal(models.Model):
    _inherit = 'account.journal'

    @api.model
    def load_real_sequences(self, data):
        if data.get('sequence_ids', False):
            ids = ",".join([str(i) for i in data.get('sequence_ids')])
            self.env.cr.execute("""
                SELECT sq.id sequence_id, sq.prefix, sq.l10n_latam_document_type_id, sq.padding, sq.name, sq.number_increment, max(am.name)
                FROM account_move am
                INNER JOIN account_journal aj ON aj.id = am.journal_id
                INNER JOIN l10n_pe_journal_sequence_rel ajsq ON ajsq.journal_id = aj.id
                INNER JOIN ir_sequence sq ON sq.id = ajsq.sequence_id AND sq.l10n_latam_document_type_id = am.l10n_latam_document_type_id
                WHERE am.type IN ('out_invoice', 'out_refund') AND sq.id IN (%s) AND am.state IN ('posted','cancel')
                GROUP BY sq.id""" % ids)
            result = self.env.cr.dictfetchall()
            return result
        else:
            return []
