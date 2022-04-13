# -*- coding: utf-8 -*-
from odoo import models, api

class PosOrder(models.Model):
    _inherit = "pos.order"

    @api.model
    def _payment_fields(self, order, ui_paymentline):
        res = super(PosOrder, self)._payment_fields(order, ui_paymentline)
        res.update({
            'transaction_id': ui_paymentline.get('payment_ref'),
        })
        return res

