# -*- coding: utf-8 -*-
from odoo import api, fields, models

import logging
log = logging.getLogger(__name__)

class PosConfig(models.Model):
    _inherit = 'pos.config'

    allow_proxy_control_sequences = fields.Boolean(string='Permitir controlar secuencias',default=False)
