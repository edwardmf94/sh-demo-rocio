# -*- coding: utf-8 -*-
from odoo import api,fields, models

class PosConfig(models.Model):
    _inherit = 'pos.config'

    ihw_proxy = fields.Boolean(string='Usa Proxy Local',default=False)
    ihw_url = fields.Char(string='Direccion de Proxy',default='')
    ihw_open_cashbox = fields.Boolean(string='Direccion de Proxy',default=False)
