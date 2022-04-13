# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError
from odoo.tools.safe_eval import safe_eval

#import logging
#log = logging.getLogger(__name__)

class SaleCouponProgram(models.Model):
	_inherit = 'sale.coupon.program'

	@api.model
	def pos_get_valid_products(self):
		res = super(SaleCouponProgram,self).pos_get_valid_products()
		i = 0
		for program_data in res['data']:
			program = self.browse(program_data['id'])
			if program.rule_partners_domain:
				domain = safe_eval(program.rule_partners_domain)
				partners_valid = self.env['res.partner'].search(domain)
				partners = []
				for partner in partners_valid:
					partners.append(partner.id)
				res['data'][i]['partners'] = partners
			i = i + 1
		return res