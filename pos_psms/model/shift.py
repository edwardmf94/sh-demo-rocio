from odoo import models, fields, api
from odoo.exceptions import UserError, ValidationError
from datetime import datetime, timedelta
import pytz

import logging
log = logging.getLogger(__name__)

class Shift(models.Model):
	_name = "pos_psms.shift"

	config_id = fields.Many2one('res.company.branch.address',string='Sucursal')
	name = fields.Char('ID Turno')
	start_at = fields.Datetime(string='Fecha de apertura')
	stop_at = fields.Datetime(string='Fecha de cierre')
	state = fields.Selection([('opening_control','Control de apertura'),('opened','Abierto'),('closing_control','Control de cierre'),('closed','Cerrado')], string='Estado')
	user_id = fields.Many2one('res.users',string='Responsable')
	shift_type_id = fields.Many2one('res.company.branch.address.shift', string='Horario')
	session_ids = fields.One2many('pos.session', 'shift_id', string='Sesiones POS')

	def action_session_closing_control(self):
		for session in self:
			session.write({'state':'closing_control'})

	def action_open(self):
		for session in self:
			if not self.config_id.sequence_shift_id:
				raise UserError("No tiene una secuencia configurada para manejo de turnos en sucursal")
			session.write({'name':self.config_id.sequence_shift_id.next_by_id(),'state':'opened','start_at':fields.Datetime.now(),'user_id':self.env.user.id,})

	def action_close(self):
		for session in self:
			session.write({'state':'closed','stop_at':fields.Datetime.now()})