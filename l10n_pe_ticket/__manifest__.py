# -*- coding: utf-8 -*-
{
	"name": "Account Print - Formato Ticket",
	"description": "Impresión en formato ticket para factura en backend",
	"depends": ["base","product","point_of_sale",'account','l10n_pe_extended','l10n_pe_edi_extended'],
	"data": [
		"security/ir.model.access.csv",
		'reports/report_invoice_ticket.xml',
		"views/account_invoice_view.xml",		
	],
	'application': True,
}