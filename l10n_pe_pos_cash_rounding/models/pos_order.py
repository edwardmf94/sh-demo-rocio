# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields
from odoo.tools import float_is_zero, float_round

class PosOrder(models.Model):
    _inherit = "pos.order"

    def _get_rounded_amount(self, amount):
        if self.config_id.cash_rounding and (
                not self.config_id.only_round_cash_method or self.payment_ids.filtered(lambda p: p.payment_method_id.is_cash_count)):
            amount = float_round(amount, precision_rounding=self.config_id.rounding_method.rounding, rounding_method=self.config_id.rounding_method.rounding_method)
        return super(PosOrder, self)._get_rounded_amount(amount)

    def _get_amount_receivable(self):
        if self.config_id.cash_rounding and (
                not self.config_id.only_round_cash_method or self.payment_ids.filtered(lambda p: p.payment_method_id.is_cash_count)):
            return self.amount_paid
        return super(PosOrder, self)._get_amount_receivable()

    def _is_pos_order_paid(self):
        res = super(PosOrder, self)._is_pos_order_paid()
        if not res and self.config_id.cash_rounding:
            currency = self.currency_id
            if self.config_id.rounding_method.rounding_method == "HALF-UP":
                maxDiff = currency.round(self.config_id.rounding_method.rounding / 2)
            else:
                maxDiff = currency.round(self.config_id.rounding_method.rounding)

            diff = currency.round(self.amount_total - self.amount_paid)
            res = abs(diff) < maxDiff
        return res
