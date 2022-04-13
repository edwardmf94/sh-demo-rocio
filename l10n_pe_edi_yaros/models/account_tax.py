# -*- coding: utf-8 -*-

from odoo import fields, api, models

class AccountTax(models.Model):
    _inherit = 'account.tax'

    def _get_l10n_pe_edi_affectation_reason(self):
        res = super(AccountTax, self)._get_l10n_pe_edi_affectation_reason()
        return self.igv_afectaction_type_id.code
    
    def _get_l10n_pe_edi_isc_type_computation(self):
        res = super(AccountTax, self)._get_l10n_pe_edi_isc_type_computation()
        return self.isc_calculation_system_id.code