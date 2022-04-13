# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

import logging
log = logging.getLogger(__name__)

class EmployeeBase(models.AbstractModel):
	_inherit = 'hr.employee.base'

	pos_cashier = fields.Boolean(string='Cashier (Pharmacy Mode)',default=False)

class Employee(models.Model):
	_inherit = 'hr.employee'

	def get_barcodes_and_pin_hashed(self):
		employees_data = super(Employee, self).get_barcodes_and_pin_hashed()
		data = self.sudo().search_read([('id', 'in', self.ids)], ['pos_cashier'])
		for e, d in zip(employees_data, data):
			e['pos_cashier'] = d['pos_cashier']
		return employees_data
