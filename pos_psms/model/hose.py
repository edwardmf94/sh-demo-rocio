from odoo import models, fields, api
from datetime import datetime, timedelta
import pytz

import logging
log = logging.getLogger(__name__)


class PosHose(models.Model):
	_name = "pos_psms.hose"

	state = fields.Selection([('enabled','Habilitado'),('disabled','Deshabilitado')], string='Estado', default='enabled', required=True)
	code = fields.Char(string='Codigo')
	name = fields.Char(string='Nombre', required=True)
	side = fields.Selection([('A','A'),('B','B')], string='Lado')
	#side_id = fields.Many2one('pos_psms.side',required=True,string="Side")
	product_id = fields.Many2one('product.product',required=True, string="Producto / Combustible")
	location_id = fields.Many2one('stock.location', required=True, string="Deposito")
	fuel_pump_id = fields.Many2one('pos_psms.fuel_pump', string="Surtidor")

class PosStatementHose(models.Model):
	_name = "pos_psms.statement.hose"

	hose_id = fields.Many2one('pos_psms.hose',string='Manguera')
	fuel_pump_id = fields.Many2one('pos_psms.fuel_pump', related='hose_id.fuel_pump_id')
	side = fields.Selection(related='hose_id.side')
	pos_session_id = fields.Many2one('pos.session', string='Sesion POS')
	start_count = fields.Float(string='Lecutra Cont. Inicial', digits=(12,3))
	end_count = fields.Float(string='Lecutra Cont. Final', digits=(12,3))
	start_count_real = fields.Float(string='Lecutra Cont. Inicial(Real)', digits=(12,3))
	end_count_real = fields.Float(string='Lecutra Cont. Inicial(Real)', digits=(12,3))
	total_quantity_real = fields.Float(string='Unidades dispensadas', digits=(12,3),compute='_total_quantity_real')
	diff_quantity_real = fields.Float(string='Diferencia Galones Real', digits=(12,3),compute='_total_quantity_real')
	diff_amount_real = fields.Float(string='Diferencia Soles Real', digits=(12,3),compute='_total_quantity_real')
	unit_price = fields.Float(string='Precio unitario')
	total_quantity = fields.Float(string='Unidades dispensadas', digits=(12,3))
	total_amount = fields.Float(string='Unidades dispensadas (S/)', digits=(12,3), compute="_total_amount")
	total_transactions = fields.Integer(string='Transacciones totales')
	theoretical_end_count = fields.Float(string='Lecutra Cont. Final (Teorico)', digits=(12,3), compute='_theoretical_end_count')
	theoretical_end_count_amount = fields.Float(string='Lecutra Cont. Final S/ (Teorico)', digits=(12,3), compute='_theoretical_end_count')
	state = fields.Selection([('open','Abierto'),('closed','Validado')], default='open', string='Estado')

	@api.depends('start_count','unit_price','total_quantity')
	def _theoretical_end_count(self):
		for rec in self:
			rec.theoretical_end_count = rec.start_count+rec.total_quantity
			rec.theoretical_end_count_amount = rec.theoretical_end_count*rec.unit_price

	@api.depends('total_quantity','unit_price')
	def _total_amount(self):
		for rec in self:
			rec.total_amount = rec.total_quantity*rec.unit_price


	@api.depends('unit_price','end_count_real','start_count_real')
	def _total_quantity_real(self):
		for rec in self:
			rec.total_quantity_real = rec.end_count_real-rec.start_count_real
			rec.diff_quantity_real = rec.total_quantity_real-rec.total_quantity
			rec.diff_amount_real = rec.diff_quantity_real*rec.unit_price