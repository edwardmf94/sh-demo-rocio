# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
#import logging
#_logger = logging.getLogger(__name__)

class GifCard(models.Model):
	_name = 'pos.gift.card'
	
	name = fields.Char(string='Code')
	partner_id = fields.Many2one('res.partner', string='Partner')
	amount = fields.Float(digits=(9,3), string='Amount')
	start_date = fields.Date(string='Available from')
	due_date = fields.Date(string='Date due')
	paid_reference = fields.Char(string='Refer payment')
	state = fields.Selection([('draft','Draft'),('open','Open'),('closed','Close')])
	repeat = fields.Boolean(string='Can be repeated',default=False)
	limit = fields.Integer(string='Maximum uses')
	counter = fields.Integer(string='Number of uses',default=0,readonly=True)

	@api.model
	def get_gift_card_info(self, card):
		card = self.search([('name','=',card),('state','!=','draft')])
		if len(card) == 0:
			return {
				'result': 'error',
				'message': _('Cannot find a valid redemption voucher with that code')
			}
		else:
			if card.state == 'closed':
				return {
					'result': 'error',
					'message': _('The voucher has already been used!')
				}
			else:
				if card.repeat:
					if card.counter < card.limit:
						return {
							'result': 'success',
							'message': _('Found!'),
							'amount': card.amount,
							'repeat': True,
							'partner': {
								'id': card.partner_id.id,
								'street': card.partner_id.street,
								'name': card.partner_id.name,
								'vat': card.partner_id.vat,
							}
						}
					else:
						return {
							'result': 'error',
							'message': 'El vale ya ha sido utilizado!'
						}
			return {
				'result': 'success',
				'message': _('Found!'),
				'amount': card.amount,
				'repeat': False,
				'partner': {
					'id': card.partner_id.id,
					'street': card.partner_id.street,
					'name': card.partner_id.name,
					'vat': card.partner_id.vat,
				}
			}
