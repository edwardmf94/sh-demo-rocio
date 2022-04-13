# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError
from odoo.tools.safe_eval import safe_eval

class SaleCouponProgram(models.Model):
	_inherit = 'sale.coupon.program'

	@api.model
	def pos_get_valid_products(self):
		program_products = []
		programs = self.search([])
		for program in programs:
			domain = safe_eval(program.rule_products_domain)
			products_valid = self.env['product.template'].search(domain)
			products = []
			for product in products_valid:
				products.append(product.id)
			program_products.append({
				'id': program.id,
				'name': program.name,
				'products': products
			})
		return {
			'data': program_products
		}