# -*- coding: utf-8 -*-
from odoo import models, fields, api

import logging
log = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    allow_check_history = fields.Boolean(string='Permitir ver historial de cliente',default=False)
