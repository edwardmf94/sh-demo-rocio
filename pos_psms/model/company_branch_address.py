from odoo import models, fields, api, exceptions
from datetime import datetime, timedelta
import pytz

import logging
log = logging.getLogger(__name__)


class CompanyBranchShift(models.Model):
	_name = "res.company.branch.address.shift"

	company_branch_address_id = fields.Many2one('res.company.branch.address', string='Sucursal', required=True)
	name = fields.Char(string="Nombre")
	start = fields.Integer(string='Hora de inicio')


class CompanyBranch(models.Model):
	_inherit = "res.company.branch.address"

	tolerance = fields.Integer(string="Minutos de tolerancia",size=2)
	sequence_shift_id = fields.Many2one('ir.sequence', string='Secuencia turno', copy=False)
	type_ids = fields.One2many('res.company.branch.address.shift','company_branch_address_id', string="Turnos")
	current_shift_id = fields.Many2one('pos_psms.shift', string='Turno actual', readonly=True)
	current_shift_user_id = fields.Many2one('res.users', related='current_shift_id.user_id', string='Responsable actual')
	current_shift_state = fields.Selection(related='current_shift_id.state', string='Estado actual')

	def open_new_shift(self):
		for branch in self:
			current_hour = int(fields.Datetime.context_timestamp(self,datetime.now()).strftime('%H'))
			temp = False
			last = False
			for type_config in branch.type_ids:
				if type_config.start <= current_hour:
					temp = type_config.id
				last = type_config.id
			if temp == False:
				temp = last
			shift = self.env['pos_psms.shift'].create({
				'config_id':branch.id,
				'shift_type_id':temp,
				'state':'opening_control'
				})
			branch.current_shift_id = shift.id
			shift.action_open()

	def close_existing_shift(self):
		for branch in self:
			sessions = self.env['pos.session'].search([('shift_id','=',branch.current_shift_id.id),('state','!=','closed')])
			if len(sessions)>0:
				raise exceptions.Warning("Se han encontrado puntos de venta asociados a este turno sin cerrar")
			else:
				branch.current_shift_id.action_close()
				branch.current_shift_id = False
