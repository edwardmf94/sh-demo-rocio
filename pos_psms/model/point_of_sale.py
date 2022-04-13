from odoo import models, fields, api
from openerp.osv import osv
from openerp.exceptions import UserError, ValidationError
from openerp.tools.translate import _
import openerp.addons.decimal_precision as dp
from datetime import datetime, timedelta
import pytz

import logging
log = logging.getLogger(__name__)


class PointOfSale(models.Model):
	_inherit = "pos.config"

	background = fields.Binary(string='Imagen de fondo', required=False, help='Subir imagen de fondo para POS.')
	fuel_pump_ids = fields.One2many('pos_psms.fuel_pump','pos_config_id',string="Surtidores de combustible")
	psms = fields.Boolean(string='Modo estacion de combustible',default=False)


class PosSession(models.Model):
	_inherit = "pos.session"
	shift_id = fields.Many2one('pos_psms.shift', string='Turno')
	hose_statement_ids = fields.One2many('pos_psms.statement.hose', 'pos_session_id', string='Extractos de contometros')

	@api.model
	def create(self, values):
		config_id = values.get('config_id', False)
		if not config_id:
			raise UserError(_("You should assign a Point of Sale to your session."))

		jobj = self.env['pos.config']
		pos_config = jobj.browse(config_id)

		shift = False
		if pos_config.company_branch_address_id:
			if pos_config.psms == True:
				shift = self.env['pos_psms.shift'].search([('config_id','=',pos_config.company_branch_address_id.id),
					('state','=','opened')])
				if shift:
					shift = shift[0]
				else:
					raise UserError(_("No hay turnos activos en establecimiento anexo"))
		else:
			raise UserError(_("El POS no esta asociado a un establecimiento anexo"))

		res = super(PosSession,self).create(values)
		if res and shift and pos_config.psms == True:
			if res.config_id.fuel_pump_ids:
				for fuel_pump in res.config_id.fuel_pump_ids:
					for hose in fuel_pump.hose_ids:
						self.env.cr.execute("SELECT end_count FROM pos_psms_statement_hose sh INNER JOIN pos_session ps ON sh.pos_session_id=ps.id WHERE sh.hose_id = %s AND sh.state='closed' ORDER BY ps.start_at DESC LIMIT 1" % (hose.id))
						last_statement_hose = self.env.cr.dictfetchall()
						start_count = 0
						if len(last_statement_hose):
							start_count = last_statement_hose[0].get('end_count',0)

						self.env['pos_psms.statement.hose'].create({
							'hose_id':hose.id,
							'pos_session_id':res.id,
							'start_count':start_count,
							'end_count':0,
							'unit_price':hose.product_id.list_price,
							'total_quantity':0,
							'total_transactions':0
							})
			res.write({
				'shift_id':shift.id
			})
		return res

	def _check_pos_session_balance(self):
		res = super(PosSession,self)._check_pos_session_balance()
		for session in self:
			for statement in session.hose_statement_ids:
				statement.write({'state':'closed','end_count': statement.start_count+statement.total_quantity})