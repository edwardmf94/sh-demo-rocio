# -*- coding: utf-8 -*-
from odoo import models, fields, api

import logging
log = logging.getLogger(__name__)


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    total_weight = fields.Float(string='Peso total',)

class PosOrder(models.Model):
    _inherit = "pos.order"

    total_weight = fields.Float(string='Peso total',)
