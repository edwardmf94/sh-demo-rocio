# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError
#import logging
#log = logging.getLogger(__name__)

class PosSession(models.Model):
	_inherit = 'pos.session'

	def action_pos_session_close(self):
		# Session without cash payment method will not have a cash register.
		# However, there could be other payment methods, thus, session still
		# needs to be validated.
		if not self.cash_register_id:
			return self._validate_session()

		if self.cash_control and abs(self.cash_register_difference) > self.config_id.amount_authorized_diff:
			# Only pos manager can close statements with cash_register_difference greater than amount_authorized_diff.
			if not self.user_has_groups("point_of_sale.group_pos_manager"):
				raise UserError(_('Your ending balance is too different from the theoretical balance. You can contact your administrator to close it.'))
			else:
				return self._warning_balance_closing()
		else:
			return self._validate_session()
