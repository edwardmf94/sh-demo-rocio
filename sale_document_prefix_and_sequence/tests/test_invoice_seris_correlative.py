# coding: utf-8

from odoo.tests.common import TransactionCase
from odoo.tests.common import Form


class TestInvoiceSeriesCorrelative(TransactionCase):

    def setUp(self):
        super(TestInvoiceSeriesCorrelative, self).setUp()
        self.account_invoice_model = self.env['account.move']
        self.partner_id = self.env['res.partner'].create({
            'name': "Jose ",
        })
        self.product_id = self.env['product.product'].create({
            'name': "Impresora",
            'lst_price': 124
        })

    def create_invoice(self, type_invoice, invoice_amount):
        invoice_form = Form(
            self.account_invoice_model.with_context(default_type=type_invoice)
        )
        invoice_form.partner_id = self.partner_id
        invoice_form.invoice_date = "2019-01-16"
        obj_invoice = invoice_form.save()
        with Form(obj_invoice) as obj_inv:
            with obj_inv.invoice_line_ids.new() as obj_line:
                obj_line.product_id = self.product_id
                obj_line.quantity = 3
                obj_line.price_unit = invoice_amount
                obj_line.account_id = self.env['account.account'].search([
                    ('user_type_id', '=', self.env.ref('account.data_account_type_revenue').id)
                ], limit=1)

        return obj_invoice

    def test_01_set_series_correlative_invoice(self):
        invoice = self.create_invoice(
            type_invoice='out_invoice', invoice_amount=50
        )
        invoice.post()
        self.assertEqual(invoice.name, invoice.prefix_val + invoice.suffix_val)
        print('------------TEST OK - SET SERIES/CORRELATIVE IN INVOICE------------')
