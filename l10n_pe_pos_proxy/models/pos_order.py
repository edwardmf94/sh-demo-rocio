# -*- coding: utf-8 -*-
from odoo import api,fields, models

import logging
log = logging.getLogger(__name__)

class PosOrder(models.Model):
    _inherit = 'pos.order'

    offline_invoice_number = fields.Char(string='Secuencia de factura')
    offline_invoice_number_int = fields.Char(string='Numero de factura')

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res['offline_invoice_number'] = ui_order.get('offline_invoice_number', False)
        res['offline_invoice_number_int'] = ui_order.get('offline_invoice_number_int', False)
        return res

    def _prepare_invoice_vals(self):
        res = super(PosOrder, self)._prepare_invoice_vals()
        res['name'] = self.offline_invoice_number if self.offline_invoice_number else "/"
        res['ref'] = self.offline_invoice_number if self.offline_invoice_number else "/"
        return res
