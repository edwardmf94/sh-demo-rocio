# -*- coding: utf-8 -*-
{
	"name": "POS PSMS",
	"description": "",
	"depends": ["product","fleet","company_branch_address_pos","account"],
	"data": [
		"security/ir.model.access.csv",
		"views/point_of_sale_view.xml",
		"views/fleet_view.xml",
		"views/psms_station_views.xml",
		"views/pos_config_view.xml",
		"views/company_branch_address_view.xml",
		"views/shift_view.xml",
		"views/account_invoice_view.xml",
		"views/templates.xml",
	],
    'qweb':[
        'static/src/xml/psms.xml',
    ],
	'application': True,
}