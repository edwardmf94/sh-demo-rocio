# -*- coding: utf-8 -*-
from odoo import models, fields, api, _


class PosPaymentMethod(models.Model):
    _inherit = 'pos.payment.method'

    gift_voucher = fields.Boolean(string='Diario para Vales de Canje',default=False)


class PosPayment(models.Model):
    _inherit = 'pos.payment'

    gift_voucher = fields.Boolean(related='payment_method_id.gift_voucher', readonly=True)
    gift_voucher_ref = fields.Char(string="Vale de Canje")
