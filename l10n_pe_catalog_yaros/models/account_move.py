# coding: utf-8

from odoo import fields, models, api


class ModelSunatCatalog(models.AbstractModel):
    _name = 'model.sunat.catalog'
    _description = 'Base model SUNAT catalog'

    code = fields.Char(
        string='Código',
        required=True
    )
    description = fields.Char(
        string='Descripción',
        required=True
    )
    name = fields.Char(string='Nombre', compute='compute_name')

    @api.depends('code', 'description')
    def compute_name(self):
        for record in self:
            record.name = "[{}] {}".format(record.code or '', record.description or '')


class IgvAfectationType(models.Model):
    _name = 'igv.afectation.type'
    _description = '[07] Tipo de Afectación al IGV'
    _inherit = 'model.sunat.catalog'


class IscCalculationSystem(models.Model):
    _name = 'isc.calculation.system'
    _description = '[08] Tipo de Sistema de Cálculo del ISC'
    _inherit = 'model.sunat.catalog'


class TransferTypeCodes(models.Model):
    _name = 'transfer.type.codes'
    _description = '[18] Códigos de modalidad de Traslado'
    _inherit = 'model.sunat.catalog'


class TransferReasonCodes(models.Model):
    _name = 'transfer.reason.codes'
    _description = '[20] Códigos de motivo de Traslado'
    _inherit = 'model.sunat.catalog'


class ChargeDiscountCodes(models.Model):
    _name = 'charge.discount.codes'
    _description = '[53] Códigos de cargos o descuentos'
    _inherit = 'model.sunat.catalog'


class AccountTax(models.Model):
    _inherit = 'account.tax'

    igv_afectaction_type_id = fields.Many2one(
        comodel_name='igv.afectation.type',
        string='[07] Tipo de Afectación al IGV'
    )
    isc_calculation_system_id = fields.Many2one(
        comodel_name='isc.calculation.system',
        string='[08] Tipo de Sistema de Cálculo del ISC'
    )


class ReasonCancellationCreditNote(models.Model):
    _inherit = 'reason.cancellation.credit.debit'

    inv_document_type_id = fields.Many2one(
        comodel_name='invoice.document.type',
        string='Tipo de Documento',
        required=True
    )


class AccountMoveReversal(models.TransientModel):
    _inherit = 'account.move.reversal'

    company_id = fields.Many2one(
        comodel_name='res.company',
        string='Compañía',
        default=lambda self: self.env.company
    )
    journal_id = fields.Many2one(
        comodel_name='account.journal',
        string='Diario',
    )
    inv_document_type_id = fields.Many2one(
        comodel_name='invoice.document.type',
        string='Tipo de documento'
    )
    prefix_val = fields.Char(
        string='Serie'
    )
    suffix_val = fields.Char(
        string='Correlativo'
    )
    document_code = fields.Char(
        related='journal_id.invoice_document_type_id.code',
        string='Tipo documento'
    )

    @api.onchange('move_type')
    def _onchange_type(self):
        if self.move_type == 'in_invoice':
            domain = "[('type', '=', 'purchase'), ('company_id', '=', company_id), ('invoice_document_type_id.code', 'in', ['07', '08'])]"
        elif self.move_type == 'out_invoice':
            domain = "[('type', '=', 'sale'), ('company_id', '=', company_id), ('invoice_document_type_id.code', 'in', ['07', '08'])]"
        return {
            'domain': {'journal_id': domain}
        }

    @api.onchange('journal_id')
    def _onchange_journal(self):
        domain = [('inv_document_type_id.code', '=', self.document_code)]
        return {'domain': {'reason_cancellation_id': domain}}

    @api.onchange('inv_document_type_id')
    def _onchange_inv_doc_tyep(self):
        if self.move_type == 'in_invoice' and self.inv_document_type_id.journal_purchase_id:
            obj_journal = self.inv_document_type_id.journal_purchase_id
            self.journal_id = obj_journal.id

    def reverse_moves(self):
        if self.move_type == 'in_invoice':
            if self.inv_document_type_id.code == '08':
                return super(AccountMoveReversal, self.with_context(
                    inv_document_type_id=self.inv_document_type_id.id,
                    prefix_val=self.prefix_val,
                    suffix_val=self.suffix_val,
                    invoice_type='in_invoice'
                )).reverse_moves()
            else:
                return super(AccountMoveReversal, self.with_context(
                    inv_document_type_id=self.inv_document_type_id.id,
                    prefix_val=self.prefix_val,
                    suffix_val=self.suffix_val,
                )).reverse_moves()
        elif self.journal_id.invoice_document_type_id.code == '08':
            return super(AccountMoveReversal, self.with_context(
                invoice_type='out_invoice',
            )).reverse_moves()
        else:
            return super(AccountMoveReversal, self).reverse_moves()


class AccountMove(models.Model):
    _inherit = 'account.move'

    def _reverse_move_vals(self, default_values, cancel=True):
        if self.env.context.get('prefix_val'):
            default_values.update({
                'inv_document_type_id': self.env.context['inv_document_type_id'],
                'prefix_val': self.env.context['prefix_val'],
                'suffix_val': self.env.context['suffix_val'],
                # 'name': self.env.context['prefix_val'] + self.env.context['suffix_val']
            })
        if self.env.context.get('invoice_type'):
            default_values.update({
                'type': self.env.context['invoice_type'],
            })
        r = super(AccountMove, self)._reverse_move_vals(
            default_values=default_values,
            cancel=cancel
        )
        if self.env.context.get('invoice_type') in ['out_invoice', 'in_invoice']:
            for line in r['line_ids']:
                line_dict = line[2]
                amount_currency = -line_dict.get('amount_currency', 0.0)
                balance = line_dict['credit'] - line_dict['debit']
                line_dict.update({
                    'amount_currency': amount_currency,
                    'debit': balance > 0.0 and balance or 0.0,
                    'credit': balance < 0.0 and -balance or 0.0,
                })
        return r


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    charge_discount_id = fields.Many2one(
        comodel_name='charge.discount.codes',
        string='[53] Códigos de cargos o descuentos'
    )
