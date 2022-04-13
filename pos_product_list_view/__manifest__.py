# -*- encoding: utf-8 -*-
{
    'name': 'POS Product In List View',
    'description': """
        Product Show in list view in Pont of Sale
""",
    'version': '1.1',
    'author': "Knacktechs Solutions",
    'license': '',
    'summary': """It will show product in list view""",
    'category': 'Point of Sale',
    'website': 'http://www.knacktechs.com',
    'images': [],
    'depends': ['point_of_sale'],
    'demo': [],
    'data': [   
                'views/point_of_sale.xml',
             ],
    'images': ['static/description/list_view.JPG'],
    'qweb': ['static/xml/pos.xml'],
    'active': False,
    'installable': True,
    'application': True,
}
