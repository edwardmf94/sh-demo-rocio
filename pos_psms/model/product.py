from odoo import models, fields, api

class Product(models.Model):
	_inherit = 'product.product'

	@api.model
	def get_prices(self):
		results = []
		products = self.search( [
			('barcode','in',['G84','G90','G95','DB5','GLP'])
		] , 0,0,'name asc' )
		for product in products:
			results.append({
				'id':product.id,
				'name':product.name,
				'barcode':product.barcode,
				'price':product.list_price
			})
		return results

	@api.model
	def upd_price(self, id, price):
		products = self.search( [('id','=',id)] )
		for product in products:
			product.write({'list_price': price})
		return True