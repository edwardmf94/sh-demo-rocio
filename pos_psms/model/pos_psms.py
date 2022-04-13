from odoo import models, fields, api, _
from datetime import datetime, timedelta
from odoo.tools import float_is_zero
import pytz

import logging
log = logging.getLogger(__name__)

class fleet_vehicle(models.Model):
	_inherit = "fleet.vehicle"

	invoice_count=fields.Integer(default='0', readonly=True)
	write_date = fields.Datetime(string='Write date', readonly=True, copy=False)
	partner_id = fields.Many2one('res.partner', string='Partner')
	organization_id = fields.Many2one('res.partner', string='Organization', domain=[('company_type','=','company')])
	driver_ids = fields.Many2many('res.partner', string='Drivers')

class AccountMove(models.Model):
	_inherit = "account.move"
	vehicle_plate = fields.Char(string='Placa')
	vehicle_driver = fields.Char(string='Conductor')
	vehicle_odometer = fields.Char(string='Odometro')
	hose_id= fields.Many2one('pos_psms.hose', string='Manguera')

class PosOrder(models.Model):
	_inherit = 'pos.order'
	vehicle_id = fields.Many2one('fleet.vehicle', string='Vehicle', help='The Vehicle where this order was served')
	vehicle_plate = fields.Char(string='Placa')
	vehicle_driver = fields.Char(string='Conductor')
	vehicle_odometer = fields.Char(string='Odometro')
	hose_id= fields.Many2one('pos_psms.hose', string='Manguera')
	summary_products = fields.Char(string='Purchased Summary',store=True)

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrder,self)._order_fields(ui_order)
		res['vehicle_plate'] = ui_order.get('vehicle_plate',False)
		res['vehicle_driver'] = ui_order.get('vehicle_driver',False)
		res['vehicle_odometer'] = ui_order.get('vehicle_odometer',False)
		res['hose_id'] = ui_order.get('hose_id',False)
		return res

	def _prepare_invoice_vals(self):
		res = super(PosOrder,self)._prepare_invoice_vals()
		res['vehicle_plate'] = self.vehicle_plate
		res['vehicle_driver'] = self.vehicle_driver
		res['vehicle_odometer'] = self.vehicle_odometer
		if self.hose_id:
			res['hose_id'] = self.hose_id.id
		return res

	def create_picking(self):
		"""Create a picking for each order and validate it."""
		Picking = self.env['stock.picking']
		Move = self.env['stock.move']
		StockWarehouse = self.env['stock.warehouse']
		HoseStatement = self.env['pos_psms.statement.hose']
		for order in self:
			if not order.lines.filtered(lambda l: l.product_id.type in ['product', 'consu']):
				continue
			address = order.partner_id.address_get(['delivery']) or {}
			picking_type = order.picking_type_id
			return_pick_type = order.picking_type_id.return_picking_type_id or order.picking_type_id
			order_picking = Picking
			return_picking = Picking
			moves = Move
			location_id = order.hose_id.location_id.id if order.hose_id else order.location_id.id
			if order.partner_id:
				destination_id = order.partner_id.property_stock_customer.id
			else:
				if (not picking_type) or (not picking_type.default_location_dest_id):
					customerloc, supplierloc = StockWarehouse._get_partner_locations()
					destination_id = customerloc.id
				else:
					destination_id = picking_type.default_location_dest_id.id

			if picking_type:
				message = _("This transfer has been created from the point of sale session: <a href=# data-oe-model=pos.order data-oe-id=%d>%s</a>") % (order.id, order.name)
				picking_vals = {
					'origin': order.name,
					'partner_id': address.get('delivery', False),
					'date_done': order.date_order,
					'picking_type_id': picking_type.id,
					'company_id': order.company_id.id,
					'move_type': 'direct',
					'note': order.note or "",
					'location_id': location_id,
					'location_dest_id': destination_id,
				}
				pos_qty = any([x.qty > 0 for x in order.lines if x.product_id.type in ['product', 'consu']])
				if pos_qty:
					order_picking = Picking.create(picking_vals.copy())
					order_picking.message_post(body=message)
				neg_qty = any([x.qty < 0 for x in order.lines if x.product_id.type in ['product', 'consu']])
				if neg_qty:
					return_vals = picking_vals.copy()
					return_vals.update({
						'location_id': destination_id,
						'location_dest_id': return_pick_type != picking_type and return_pick_type.default_location_dest_id.id or location_id,
						'picking_type_id': return_pick_type.id
					})
					return_picking = Picking.create(return_vals)
					return_picking.message_post(body=message)

			for line in order.lines.filtered(lambda l: l.product_id.type in ['product', 'consu'] and not float_is_zero(l.qty, precision_rounding=l.product_id.uom_id.rounding)):
				moves |= Move.create({
					'name': line.name,
					'product_uom': line.product_id.uom_id.id,
					'picking_id': order_picking.id if line.qty >= 0 else return_picking.id,
					'picking_type_id': picking_type.id if line.qty >= 0 else return_pick_type.id,
					'product_id': line.product_id.id,
					'product_uom_qty': abs(line.qty),
					'state': 'draft',
					'location_id': location_id if line.qty >= 0 else destination_id,
					'location_dest_id': destination_id if line.qty >= 0 else return_pick_type != picking_type and return_pick_type.default_location_dest_id.id or location_id,
				})

				#AQUI SE MODIFICA EL STATEMENT DE LA MAGUERA ASOCIADA
				if order.hose_id:
					statement_hose = HoseStatement.search([('hose_id', '=', order.hose_id.id),('pos_session_id','=',order.session_id.id)])
					if statement_hose:
						statement_hose[0].write({'total_quantity':statement_hose[0].total_quantity+line.qty,'total_transactions':statement_hose[0].total_transactions+1})

			# prefer associating the regular order picking, not the return
			order.write({'picking_id': order_picking.id or return_picking.id})

			if return_picking:
				order._force_picking_done(return_picking)
			if order_picking:
				order._force_picking_done(order_picking)

			# when the pos.config has no picking_type_id set only the moves will be created
			if moves and not return_picking and not order_picking:
				moves._action_assign()
				moves.filtered(lambda m: m.state in ['confirmed', 'waiting'])._force_assign()
				moves.filtered(lambda m: m.product_id.tracking == 'none')._action_done()

		return True

	@api.model
	def get_print(self, order_id):
		res = super(PosOrder,self).get_print(order_id)
		order = self.browse(order_id)
		res['vehicle_plate'] = order.vehicle_plate
		res['vehicle_driver'] = order.vehicle_driver
		res['vehicle_odometer'] = order.vehicle_odometer
		return res
