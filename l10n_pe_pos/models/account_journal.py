# -*- coding: utf-8 -*-
from odoo import fields, models
import logging
log = logging.getLogger(__name__)

class AccountJournal(models.Model):
    _inherit = 'account.journal'

    sequence_prefix = fields.Char(related='sequence_id.prefix')
    sequence_suffix = fields.Char(related='sequence_id.suffix')
    sequence_padding = fields.Integer(related='sequence_id.padding')
    sequence_number_increment = fields.Integer(related='sequence_id.number_increment')