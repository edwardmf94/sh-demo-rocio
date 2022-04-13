# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError
from datetime import datetime, timedelta
import logging
log = logging.getLogger(__name__)
import pytz


class PosConfig(models.Model):
	_inherit = 'pos.config'

	restrict_old_session = fields.Boolean(string='Forbid continuing a past session',default=False)

	# Methods to open the POS
	def open_ui(self):
		self.ensure_one()
		if self.restrict_old_session:
			user_tz = self.env.user.tz or pytz.utc
			local = pytz.timezone(user_tz)
			start_local = pytz.utc.localize(session.start_at).astimezone(local)
			current_local = pytz.utc.localize(fields.Datetime.now(self)).astimezone(local)
			day_format = "%d/%m/%Y"
			if start_local.strftime(day_format) == current_local.strftime(day_format):
				return super(PosConfig, self).open_ui()
			else:
				raise UserError(_("You cannot resume a session from a past day."))
		else:
			return super(PosConfig, self).open_ui()
