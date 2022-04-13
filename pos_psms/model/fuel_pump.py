from odoo import models, fields, api
from datetime import datetime, timedelta
import pytz

import logging
log = logging.getLogger(__name__)

class PosHose(models.Model):
	_name = "pos_psms.fuel_pump"

	state = fields.Selection([('enabled','Habilitado'),('disabled','Deshabilitado')], string='Estado', default='enabled', required=True)
	code = fields.Char(string='Codigo', required=True)
	name = fields.Char(string='Nombre', required=True)
	hose_ids = fields.One2many('pos_psms.hose','fuel_pump_id', string='Mangueras',required=True)
	pos_config_id = fields.Many2one('pos.config', string='Punto de Venta')