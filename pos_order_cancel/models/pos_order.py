# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError

import logging
log = logging.getLogger(__name__)


class PosOrder(models.Model):
    _inherit = 'pos.order'

    picking_return_id = fields.Many2one('stock.picking','Return Picking')

    def action_pos_order_cancel(self):
        if self.session_id.state!='opened':
            raise UserError(_('Session must be in progress state'))
        if self.state in ('paid','invoiced'):
            if not self.picking_id:
                raise UserError(_('Order needs to have a related picking'))
            stock_return_picking = self.env['stock.return.picking'].with_context(active_id=self.picking_id.id, active_ids=[self.picking_id.id], active_model='stock.picking').create({})
            stock_return_picking._onchange_picking_id()
            picking_return_context = stock_return_picking.sudo().create_returns()
            if picking_return_context.get('res_id', False):
                picking_return = self.env['stock.picking'].browse(picking_return_context['res_id'])
                self._force_picking_done(picking_return)
                self.picking_return_id = picking_return.id
                self.lines.unlink()
                self.payment_ids.unlink()
                self.amount_tax = 0
                self.amount_total = 0
                self.amount_paid = 0
                self.amount_return = 0
            else:
                raise UserError(_('An error occurred when picking return has been generated'))
        else:
            raise UserError(_('Order must be in paid or invoiced state'))
        res = super(PosOrder, self).action_pos_order_cancel()
        return res