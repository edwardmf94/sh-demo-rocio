# -*- coding: utf-8 -*-
from collections import defaultdict
from odoo import api,fields, models
import logging
log = logging.getLogger(__name__)

class PosOrder(models.Model):
    _inherit = 'pos.order'

    def _invoice_receivables_extra_fields(self):
        return {
            'partner': self.partner_id
        }