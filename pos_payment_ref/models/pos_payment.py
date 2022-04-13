# -*- coding: utf-8 -*-
from odoo import fields, models


class PosPaymentMethod(models.Model):
	_inherit = 'pos.payment.method'

	pos_payment_ref = fields.Boolean('Enable ref', default=False)
