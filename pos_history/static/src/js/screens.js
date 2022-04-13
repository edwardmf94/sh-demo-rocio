odoo.define('pos_history.screens', function(require) {
	'use strict';

	var screens = require('point_of_sale.screens');
	var gui = require('point_of_sale.gui');
	var core = require('web.core');
	var rpc = require('web.rpc');

	var QWeb = core.qweb;
	var _t = core._t;

	screens.ProductScreenWidget.include({
		start: function() {
			var self = this;
			this._super();
			this.$('[name=btnVer]').click(function() {
				self.gui.show_screen('PosOrderListScreenWidget');
			});
		}
	});

	var PosOrderListScreenWidget = screens.ScreenWidget.extend({
		template: 'PosOrderListScreenWidget',
		start: function() {
			var self = this;
			this._super();
			this.$el.find('div.button.back').click(function() {
				self.gui.show_screen('products');
			});

			this.$el.find('[name=btnDuplicate]').click(function() {
				var order = self.$('.pos-orders-contents .highlight');
				if (order.length > 0) {
					var orderId = parseInt(order.attr('data-order-id'));
					if(isNaN(orderId)) return false;
					var journalType = parseInt(order.attr('data-order-journal'));
					if(journalType=='07'){
						return self.gui.show_popup('error-traceback', {
							title: _t('INFORMACIÓN REQUERIDA'),
							body: _t('No se puede duplicar una nota de credito. Emita una nueva.')
						});
					}
					rpc
						.query({
							model: 'pos.order',
							method: 'get_print',
							args: [parseInt(orderId)]
						})
						.then(function(returnedJson) {
							self.load_from_backend(returnedJson, function() {
								self.gui.show_screen('products');
							});
						});
				} else {
					self.gui.show_popup('error-traceback', {
						title: _t('INFORMACIÓN REQUERIDA'),
						body: _t('Debe seleccionar una orden para continuar')
					});
				}
			});

			this.$('.searchbox input').on('keyup', function(event) {
				if (event.keyCode == 13) {
					var query = this.value;
					self.perform_search(query);
				}
			});

			this.$('.searchbox .search-clear').click(function() {
				self.clear_search();
			});

			this.$('.searchbox input').val('').focus();
		},
		get_detail_line_from_backend: function(line, data) {
			return {
				price: line.price_unit,
				quantity: line.quantity,
				discount: line.discount,
				merge: false
			}
		},
		other_validation: function(data){
			return false;
		},
		other_process: function(data){
		},
		load_from_backend: function(data, cb) {
			var self = this;
			var orderPos = self.pos.get_order();
			orderPos.destroy();
			orderPos = self.pos.get_order();
			var client;
			$.each(data.orderlines, function() {
				var line = this;
				var product = self.pos.db.get_product_by_id(line.product_id);
				var detail_line = self.get_detail_line_from_backend(line, data)
				orderPos.add_product(product, detail_line);
				var selected_orderline = orderPos.get_selected_orderline();
				selected_orderline.price_manually_set = true;
				if(selected_orderline.set_uom!==undefined)
					selected_orderline.set_uom({0:line.unit_id,1:line.unit_name});
			});
			if (data.client_id) {
				client = self.pos.db.get_partner_by_id(data.client_id);
				if (!client) {
					console.error(
						'ERROR: trying to load a parner not available in the pos'
					);
				}
			} else {
				client = null;
			}

			if(self.other_validation(data)){
				self.other_process(data)
			} else {
				orderPos.set_sale_journal(data.journal_id);
			}

			orderPos.set_client(client);
			if (data.journal_id != self.pos.config.journal_id[0]) {
				orderPos.set_to_invoice(true);
			}
			cb();
		},
		add_product_attribute: function(product, key, orderline) {
			return product;
		},
		load_order_fields: function(order, fields) {
			order.set_order_id(fields.id);
			var partner = this.pos.db.get_partner_by_id(fields.partner_id);
			order.set_client(partner || undefined);
			if (partner == null) {
				this.pos.get('selectedOrder').set_client(fields.client_data);
			}
			return order;
		},
		prepare_orderline_options: function(orderline) {
			return {
				quantity: orderline.qty,
				price: orderline.price_unit,
				discount: orderline.discount,
				merge: false
			};
		},
		_get_load_fields_order: function(){
			return [
				'name',
				'account_move_name',
				'date_order',
				'partner_id',
				'user_id',
				'amount_total',
				'state',
				'session_id',
				'pos_reference',
				'amount_tax',
			]
		},
		load_orders: function(query) {
			var self = this;
			$('.js_synch').click();
			var def = new $.Deferred();
			var fields = self._get_load_fields_order();
			var filter_query = ['|',['account_move_name', 'ilike', query],['name', 'ilike', query]];
			var tipoSel = $('.pos_order_list-screen .all_sessions').val();
			if(query==''){
				filter_query = [['session_id', '=', self.pos.pos_session.id]];
			}
			if(tipoSel=='0'&&query!=''){
				filter_query.push(['session_id', '=', self.pos.pos_session.id]);
			}
			rpc
				.query({
					model: 'pos.order',
					method: 'search_read',
					domain: filter_query,
					fields: fields,
					limit: 80
				})
				.then(
					function(results) {
						if (self.render_list(results)) {
							def.resolve();
						} else {
							def.reject();
						}
					},
					function(err, event) {
						event.preventDefault();
						def.reject();
					}
				);
		},
		reload_partners: function(){
			var self = this;
			return this.pos.load_new_partners();
		},
		show: function() {
			this._super();
			$('.pos_order_list-screen .subwindow.collapsed').hide();
		},
		on_click_invoice: function(event) {
			var contents = this.$('.pos-orders-contents');
			contents.find('.highlight').removeClass('highlight');
			$(event.target)
				.closest('tr')
				.addClass('highlight');
		},
		render_list: function(invoices) {
			var states = {
				draft: 'NUEVO',
				paid: 'PAGADO',
				cancel: 'ANULADO',
				invoiced: 'FACTURADO',
				done: 'CONTABILIZADO'
			};
			var self = this;
			var contents = this.$el[0].querySelector('.pos-orders-contents');
			contents.innerHTML = '';
			for (var i = 0, len = invoices.length; i < len; i++) {
				var order = invoices[i];
				order.date_order = moment(order.date_order, 'YYYY-MM-DD hh:mm:ss')
					.subtract(5, 'hours')
					.format('DD/MM/YYYY hh:mm A');
				order.amount_total = order.amount_total.toFixed(2);
				order.state = states[order.state];
				var invoiceline_html = QWeb.render('PosOrderLineWidget', {
					widget: this,
					order: invoices[i]
				});
				var invoiceline = document.createElement('tbody');
				invoiceline.innerHTML = invoiceline_html;
				invoiceline = invoiceline.childNodes[1];
				invoiceline.addEventListener('click', this.on_click_invoice);
				contents.appendChild(invoiceline);
			}
			return true;
		},
		perform_search: function(query) {
			this.load_orders(query);
		},
		clear_search: function() {
			this.load_orders();
			this.$('.searchbox input')[0].value = '';
			this.$('.searchbox input').focus();
		}
	});

	gui.define_screen({
		name: 'PosOrderListScreenWidget',
		widget: PosOrderListScreenWidget
	});

	return {
		PosOrderListScreenWidget: PosOrderListScreenWidget,
	}

});