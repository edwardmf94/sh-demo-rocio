# -*- coding: utf-8 -*-
from odoo import models, fields, api

import logging
log = logging.getLogger(__name__)


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    def _order_line_fields(self, line, session_id=None):
        newline = super(PosOrderLine, self)._order_line_fields(line, session_id)
        sline = line[2]
        if sline.get('tax_bonification_id', False) and sline.get('discount', 0) == 100:
            newline[2]['tax_ids'] = [[6, False, [sline['tax_bonification_id']]]]
        return newline
