odoo.define('pos_customer_history.screens', function(require) {
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
			self.$('[name=btnHistory]').click(function() {
				var orderPos = self.pos.get_order();
				var partner = orderPos.get_client();
				if (orderPos.get_client()){
					if (partner.barcode == 'CLIENTE_ANONIMO') {
						return self.gui.show_popup('error', {
							title: _t('Error detected'),
							body: 'No puede solicitar la historia de ventas del CLIENTE ANONIMO.'
						});
					}
					self.gui.show_screen('CustomerHistoryScreenWidget',{partner_id: partner.id});
				} else {
					return self.gui.show_popup('error', {
						title: _t('Error detected'),
						body: 'No seleccionó un cliente'
					});
				}
			});
			if(!self.pos.config.allow_check_history){
				self.$('[name=btnHistory]').remove();
			}
		}
	});


	var CustomerHistoryScreenWidget = screens.ScreenWidget.extend({
		template: 'CustomerHistoryScreenWidget',
		start: function() {
			var self = this;
			this._super();
			this.$el.find('div.button.back').click(function() {
				self.gui.show_screen('products');
			});

			this.$el.find('[name=btnSaleCreate]').click(function() {
				var order = self.$('.sale-orders-contents .highlight');
				if (order.length > 0) {
					var orderId = parseInt(order.attr('data-order-id'));
					self.load_from_backend(orderId,false);
				} else {
					self.gui.show_popup('error-traceback', {
						title: 'INFORMACIÓN REQUERIDA',
						body: 'Debe seleccionar una orden para continuar'
					});
				}
			});
		},
		show: function() {
			this._super();
			var self = this;

			var partner_id = self.gui.get_current_screen_param('partner_id');
			self.load_orders(partner_id);
		},
		load_orders: function(partner_id) {
			var self = this;
			var def = new $.Deferred();
			var fields = [
				'name',
				'date_order',
				'user_id',
				'amount_total',
				'account_move_name',
				'state',
			];
			var filter_query = [['partner_id', '=', partner_id]];
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
		render_list: function(invoices) {
			var states = {
				draft: 'NUEVO',
				sent: 'ENVIADO',
				sale: 'ORDENADO',
				done: 'CONTABILIZADO',
				cancel: 'ANULADO',
			};
			var self = this;
			var contents = this.$el[0].querySelector('.sale-orders-contents');
			contents.innerHTML = '';
			for (var i = 0, len = invoices.length; i < len; i++) {
				var order = invoices[i];
				order.date_order = moment(order.date_order, 'YYYY-MM-DD hh:mm:ss')
					.subtract(5, 'hours')
					.format('DD/MM/YYYY hh:mm A');
				order.amount_total = order.amount_total.toFixed(2);
				order.state = states[order.state];
				var invoiceline_html = QWeb.render('CustomerHistoryLineWidget', {
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
		on_click_invoice: function(event) {
			var contents = this.$('.sale-orders-contents');
			contents.find('.highlight').removeClass('highlight');
			$(event.target)
				.closest('tr')
				.addClass('highlight');
			var orderId = parseInt($(event.target).closest('tr').attr('data-order-id'));
			this.load_from_backend(orderId,true);
		},
		load_from_backend: function(orderId,renderProd) {
			var self = this;
			var $tableProd = $('.sale-order-products');
			$tableProd.empty();

			rpc.query({
				model: 'pos.order',
				method: 'get_print',
				args: [parseInt(orderId)]
			})
			.then(function(data) {
				if(renderProd){
					$.each(data.orderlines, function() {
						var line = this;
						var product = self.pos.db.get_product_by_id(line.product_id);
						$tableProd.append(`<tr><td>
            				<span class="product-name">${line.product_name}</span> - Total:<strong class="price">S/${line.price_with_tax}</strong>
            				<ul class="info-list">
			                    <li class="info"><em>${line.qty}</em> ${line.unit_name} en S/${line.price_unit}</li>
                			</ul>
						</td></tr>`);
					});
				}else{
					var orderPos = self.pos.get_order();
					orderPos.destroy();
					orderPos = self.pos.get_order();
					$.each(data.orderlines, function() {
						var line = this;
						var product = self.pos.db.get_product_by_id(line.product_id);
						orderPos.add_product(product, {
							price: line.price_unit,
							quantity: line.qty,
							discount: line.discount,
							merge: false
						});
					});
					var client = null;
					if (data.client_id) {
						client = self.pos.db.get_partner_by_id(data.client_id);
						if (!client) {
							console.error(
								'ERROR: trying to load a parner not available in the pos'
							);
						}
					}
					orderPos.set_client(client);
					self.gui.show_screen('products');
				}
			});
		}
	});

	gui.define_screen({
		name: 'CustomerHistoryScreenWidget',
		widget: CustomerHistoryScreenWidget
	});

	return {
		CustomerHistoryScreenWidget: CustomerHistoryScreenWidget,
	};

});