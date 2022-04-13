# -*- coding: utf-8 -*-
from odoo import api, models, fields, _
import requests
import json

import logging
log = logging.getLogger(__name__)

VAT_SERVER_URL = "https://ruc.conflux.pe/api/partner/"

class ResPartner(models.Model):
	_inherit = 'res.partner'

	@api.model
	def create_from_ui(self, partner):
		if 'l10n_latam_identification_type_id' in partner:
			partner['l10n_latam_identification_type_id'] = int(partner['l10n_latam_identification_type_id'])
		if 'zip' in partner:
			ubigeo = partner['zip']
			if ubigeo != False:
				if len(ubigeo)==6:
					countries = self.env['res.country'].search([('code','=','PE')])
					country_id = countries[0].id
					states = self.env['res.country.state'].search([('code','=',ubigeo[0:2]),('country_id','=',country_id)])
					state_id = states[0].id
					cities = self.env['res.city'].search([('l10n_pe_code','=',ubigeo[0:4]),('country_id','=',country_id),('state_id','=',state_id)])
					city_id = cities[0].id
					districts = self.env['l10n_pe.res.city.district'].search([('code','=',ubigeo)])
					district_id = districts[0].id
					partner['country_id'] = country_id
					partner['state_id'] = state_id
					partner['city_id'] = city_id
					partner['l10n_pe_district'] = district_id
		return super(ResPartner, self).create_from_ui(partner)

	def do_get(self, url=None, token='', vat=False):
		s = requests.Session()
		if len(vat) != 11:
			return (False, "Ingrese un RUC valido!")
		if not url:
			return (False, _("The VAT server url not found"))
		try:
			if token:
				r = s.get(url+vat, headers={'Authorization': token})
			else:
				r = s.get(url+vat)
		except requests.exceptions.RequestException as e:
			return (False, e)
		if r.status_code == 200:
			return (True, r.content)
		else:
			return (False, _("There's problems to connecte with the VAT server"))

	def do_get_dni(self, url=None, token='', vat=False):
		s = requests.Session()
		if len(vat) != 8:
			return (False, "Ingrese un DNI valido!")
		if not url:
			return (False, _("The VAT server url not found"))
		try:
			if token:
				r = s.get(url+vat, headers={'Authorization': token})
			else:
				r = s.get(url+vat)
		except requests.exceptions.RequestException as e:
			return (False, e)
		if r.status_code == 200:
			return (True, r.content)
		else:
			return (False, {
				'title': _('Validation error'),
				'message': _('El servidor de comprobación no está disponible!')
			})

	@api.model
	def get_company_details(self, ruc):
		res = {}
		company = self.env.company
		if not ruc:
			return res
		respuesta = self.do_get(VAT_SERVER_URL, company.token_api_ruc, ruc)
		if not respuesta:
			raise Warning(_("Server not responding now, try again later"))
		if not respuesta[0]:
			return {'warning':respuesta[1]}
		try:
			respuesta_json = json.loads(respuesta[1].decode())
		except ValueError as e:
			raise Warning(
				_("Server response content is not serializable to JSON object: %s" % e))

		if respuesta_json.get('error', False):
			if respuesta_json.get('message', False):
				raise Warning(respuesta_json.get('message'))

		if respuesta_json.get('nombre', False):
			res['name'] = respuesta_json.get('nombre')
		if respuesta_json.get('direccion', False):
			res['street'] = respuesta_json.get('direccion')
		res['country_id'] = self.env['res.country'].search([('code', '=', 'PE')])[
			0]
		if respuesta_json.get('estado', False):
			res['sunat_state'] = respuesta_json.get('estado')
		if respuesta_json.get('condicion', False):
			res['sunat_condition'] = respuesta_json.get('condicion')
		if respuesta_json.get('telefono', False):
			res['phone'] = respuesta_json.get('phone')
		if respuesta_json.get('agente_retencion', False):
			res['sunat_retention_agent'] = True
		if respuesta_json.get('retencion', False):
			res['sunat_retention'] = respuesta_json.get('retencion')
		if respuesta_json.get('ubigeo', False):
			res['zip'] = respuesta_json.get('ubigeo')
		return res

	@api.model
	def get_partner_details(self, dni):
		res = {}
		company = self.env.company
		if not dni:
			return res
		respuesta = self.do_get_dni(VAT_SERVER_URL+'dni/',company.token_api_ruc, dni)
		if not respuesta:
			raise Warning(_("Server not responding now, try again later"))
		if not respuesta[0]:
			return {'warning':{
				'title':'Error',
				'message':'No existe'
			}}
		try:
			respuesta_json = json.loads(respuesta[1].decode())
		except ValueError as e:
			raise Warning(
				_("Server response content is not serializable to JSON object: %s" % e))
		if respuesta_json.get('error', False):
			if respuesta_json.get('message', False):
				raise Warning(respuesta_json.get('message'))
		if respuesta_json.get('name', False):
			res['name'] = respuesta_json.get('name')
		res['country_id'] = self.env['res.country'].search([('code', '=', 'PE')])[0]
		return res

	@api.model
	def weservice_peru(self, vat_type, vat):
		response = {
			"status": "error",
			"message": "No se ha encontrado resultados para su busqueda",
			"data": {}
		}
		if vat and vat_type == '6':
			res = {}
			if (not vat) or (len(vat) < 8 or len(vat) > 11) or not vat.isdigit():
				res['warning'] = {
					'title': _('Validation error'),
					'message': _('RUC should be numeric, 8-11 numbers long! Please check!')
				}
			details = self.get_company_details(vat)
			if 'warning' in details:
				res['warning'] = details['warning']
			else:
				l10n_latam_identification_type_id = self.env['l10n_latam.identification.type'].search([('l10n_pe_vat_code','=','6')],limit=1)
				if 'name' in details:
					res['name'] = details['name']
				if 'street' in details:
					res['street'] = details['street']
				if 'phone' in details:
					res['phone'] = details['phone']
				if 'country_id' in details:
					res['country_id'] = details['country_id']
				if 'zip' in details:
					res['zip'] = details['zip']
				if l10n_latam_identification_type_id:
					res['l10n_latam_identification_type_id'] = l10n_latam_identification_type_id.id
				response['status'] = 'success'
				response['data'] = res

		if vat and vat_type == '1':
			res = {}
			if (not vat) or (len(vat) != 8) or not vat.isdigit():
				res['warning'] = {
					'title': _('Validation error'),
					'message': _('DNI should be numeric, 8 numbers long! Please check!')
				}
			details = self.get_partner_details(vat)
			if 'warning' in details:
				res['warning'] = details['warning']
			else:
				l10n_latam_identification_type_id = self.env['l10n_latam.identification.type'].search([('l10n_pe_vat_code','=','1')],limit=1)
				if 'name' in details:
					res['name'] = details['name']
					res['l10n_latam_identification_type_id'] = l10n_latam_identification_type_id.id
				response['status'] = 'success'
				response['data'] = res
		return response
