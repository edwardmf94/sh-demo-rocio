# -*- coding: utf-8 -*-
from odoo import models, fields, api

class HrEmployee(models.Model):
	_inherit = "hr.employee"

	pos_level = fields.Selection([('cashier','Cajero'),
		('manager','Gerente de Tienda'),
		('admin','Administrador')],string='Permiso en POS',default='cashier')