# -*- coding: utf-8 -*-
from odoo import models, fields, api

import logging
log = logging.getLogger(__name__)


class PosConfig(models.Model):
	_inherit = "pos.config"

	allow_summary_session = fields.Boolean(string='Permitir vista de resúmen de sesión',default=False)
	allow_summary_control = fields.Boolean(string='Solo encargados pueden ver la sesión',default=False)
	allow_summary_all_session = fields.Boolean(string='Permitir lista de resumenes de sesión',default=False)
