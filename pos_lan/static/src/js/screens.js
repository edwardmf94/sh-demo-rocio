odoo.define('pos_lan.screens', function(require) {
	'use strict';

	var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');
	var screensHr = require('pos_hr.screens');
	var gui = require('point_of_sale.gui');
	var core = require('web.core');
	var Session = require('web.Session');

	var QWeb = core.qweb;
	var _t = core._t;

	var chrome = require('point_of_sale.chrome');

	screensHr.LoginScreenWidget.include({
		unlock_screen: function(){
			var self = this;
			this._super();
			var employee = self.pos.get_cashier();
			if(!employee.pos_cashier && self.pos.get_order()){
				self.pos.get_order().set_seller_id(employee.id);
			}
		}
	})

	chrome.UsernameWidget.include({
		open_payment: function(){
			var self = this;
			var order = self.pos.get_order();
			var has_valid_product_lot = _.every(order.orderlines.models, function(line){
				return line.has_valid_product_lot();
			});
			if(!has_valid_product_lot){
				self.gui.show_popup('confirm',{
					'title': _t('Empty Serial/Lot Number'),
					'body':  _t('One or more product(s) required serial/lot number.'),
					confirm: function(){
						self.gui.show_screen('payment');
					},
				});
			}else{
				self.gui.show_screen('payment');
			}
		},
		renderElement: function(){
			var self = this;
			this._super();
			if (self.pos.config.pos_lan){
				var employee = self.pos.get_cashier();
				if(employee.pos_cashier){
					$('.actionpad .button.pay').html(`<div class='pay-circle'>
						<i class='fa fa-chevron-right' />
					</div>`+_t("Pay") );
				}else{
					$('.actionpad .button.pay').html(`<div class='pay-circle'>
						<i class='fa fa-save' />
					</div>`+_t("Save") );
				}
				this.$('.pay').unbind('click').click(function(){
					if(self.pos.config.pos_lan){
						var employee = self.pos.get_cashier();
						if(employee.pos_cashier){
							self.open_payment();
						}else{
							if(self.pos.config.ihw_proxy){
								$('[name=btnGuardarLocal]').click();
							} else {
								return self.pos.gui.show_popup('error-traceback', {
									title: _t('Connection error'),
									body: _t('Configure a proxy for saving local orders.')
								});
							}
						}
					} else {
						self.open_payment();
					}
				});
			}
		},
		click_username: function(){
			if(!this.pos.config.module_pos_hr) { return; }
			var self = this;
			this.gui.select_employee({
				'security':     true,
				'current_employee': this.pos.get_cashier(),
				'title':      _t('Change Cashier'),
			}).then(function(employee){
				self.pos.set_cashier(employee);
				if(!employee.pos_cashier && self.pos.get_order()){
					self.pos.get_order().set_seller_id(employee.id);
				}
				self.chrome.widget.username.renderElement();
				self.renderElement();
			});
		},
	});

	screens.ActionpadWidget.include({
		open_payment: function(){
			var self = this;
			var order = self.pos.get_order();
			var has_valid_product_lot = _.every(order.orderlines.models, function(line){
				return line.has_valid_product_lot();
			});
			if(!has_valid_product_lot){
				self.gui.show_popup('confirm',{
					'title': _t('Empty Serial/Lot Number'),
					'body':  _t('One or more product(s) required serial/lot number.'),
					confirm: function(){
						self.gui.show_screen('payment');
					},
				});
			}else{
				self.gui.show_screen('payment');
			}
		},
		renderElement: function() {
			var self = this;
			this._super();
			var employee = self.pos.get_cashier();
			if (self.pos.config.pos_lan){
				if(employee.pos_cashier){
					$('.actionpad .button.pay').html(`<div class='pay-circle'>
						<i class='fa fa-chevron-right' />
					</div>`+_t("Pay") );
				}else{
					$('.actionpad .button.pay').html(`<div class='pay-circle'>
						<i class='fa fa-save' />
					</div>`+_t("Save") );
				}
				this.$('.pay').unbind('click').click(function(){
					self.click_pay_button();
				});
			}
		},
		click_pay_button: function(){
			var self = this;
			var employee = self.pos.get_cashier();
			if(self.pos.config.pos_lan){
				var employee = self.pos.get_cashier();
				if(employee.pos_cashier){
					self.open_payment();
				}else{
					if(self.pos.config.ihw_proxy){
						$('[name=btnGuardarLocal]').click();
					} else {
						return self.pos.gui.show_popup('error-traceback', {
							title: _t('Error de conexión'),
							body: _t('Configure a proxy for saving local orders.')
						});
					}
				}
			} else {
				self.open_payment();
			}
		}
	});

	screens.ProductScreenWidget.include({
		saving_lock: false,
		start: function() {
			var self = this;
			this._super();
			this.$('[name=btnPedidos]').click(function() {
				self.gui.show_screen('local_order_list_screen');
			});
			this.$('[name=btnGuardarLocal]').click(function() {
				if(self.pos.config.ihw_proxy){
					if(!self.saving_lock && self.pos.get_order()!=null){
						self.saving_lock = true;
						var order = self.pos.get_order();
						if (order.get_orderlines().length === 0) {
							self.gui.show_popup('error',{
								'title': _t('Empty Order'),
								'body':  _t('There must be at least one product in your order before it can be validated'),
							});
							self.saving_lock = false;
							return false;
						}
						var errorQty = false;
						_(order.get_orderlines()).each(function(line) {
							if (line.quantity == 0) {
								errorQty = line.product.display_name;
							}
						});
						if (errorQty) {
							self.gui.show_popup('error', {
								title: _t('Cantidad invalida'),
								body: _t('No puede vender 0 unidades en ' + errorQty)
							});
							self.saving_lock = false;
							return false;
						}
						var orderJson = order.export_as_JSON();
						var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
						connection.rpc('/hw_local/save', {
							data: orderJson,
							company_id: self.pos.company.id || 1
						}, { timeout: 7500 }).then(function(result){
							self.saving_lock = false;
							if(self.pos.config.print_dispatch){
								self.gui.show_screen('print_dispatch',{tempName: result[0].id});
								alert(result[0].id);
							}else{
								self.pos.delete_current_order();
								self.pos.gui.show_popup('alert', {
									title: _t('Order ready for box'),
									body: _t('Order ')+result[0].id
								});
							}
						})
						.catch(function(err){
							self.saving_lock = false;
							console.error('[proxy save]',err);
							return self.pos.gui.show_popup('error-traceback', {
								title: _t('Connection error'),
								body: _t('No connection to the proxy')
							});
						});
					}
				}else{
					self.saving_lock = false;
					return self.pos.gui.show_popup('error', {
						title: _t('Connection error'),
						body: 'No hay proxy definido para el POS'
					});
				}
			});
			if(!self.pos.config.pos_lan){
				this.$('[name=btnPedidos]').remove();
				this.$('[name=btnGuardarLocal]').remove();
			}
		}
	});

	screens.ReceiptScreenWidget.include({
		get_receipt_render_env: function() {
			var result = this._super();
			var receipt_screen_params = this.pos
				.get_order()
				.get_screen_data('params');
			if(receipt_screen_params){
				if(receipt_screen_params.data){
					result.order.get_seller_name = function(){
						return receipt_screen_params.data.seller_name;
					};
					return result;
				}
			}
			return result;
		}
	});

	var LocalOrdersListScreenWidget = screens.ScreenWidget.extend({
		template: 'LocalOrdersListScreenWidget',
		show: function() {
			var self = this;
			this._super();

			this.renderElement();

			this.$('.back').click(function(){
				self.gui.show_screen('products');
			});
			this.$el.find('[name=btnInvoice]').click(function() {
				$('.js_synch').click();
				var order = self.$el.find('.invoice-list .highlight');
				if (order.length > 0) {
					var jsonData = order.data('data');
					var tempId = order.attr('data-order-id');
					self.gui.show_screen('products');
					jsonData.sequence_number = self.pos.pos_session.sequence_number++;
					jsonData.uid += jsonData.sequence_number;
					jsonData.name += jsonData.sequence_number;
					jsonData.seller_id = jsonData.seller_id;
					jsonData.lan_id = tempId;
					jsonData.lines = jsonData.lines.map(function(item){
						item[2].price_manually_set = true;
						return item;
					});
					var currentOrder = self.pos.get_order();
					self.pos.get('orders').add(new models.Order({},{
						pos: self.pos,
						json: jsonData
					}));
					var orders = self.pos.get_order_list();
					self.pos.set_order(orders[orders.length-1]);
					currentOrder.destroy({'reason':'abandon'});
					var newOrder = self.pos.get_order();
					var client = false;
					client = self.pos.db.get_partner_by_id(jsonData.partner_id);
					if (!client) {
						console.error(
							'ERROR: trying to load a parner not available in the pos'
						);
					}else{
						newOrder.set_client(client);
					}
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

			$('.local_order_list-screen .subwindow.collapsed').hide();
			var query = this.$el.find('.searchbox input').val();
			this.perform_search(query);
			this.$el.find('.searchbox input').focus();
			setTimeout(function(){
				self.$el.find('.searchbox input').val('');
			},50)
		},
		load_orders: function(query) {
			var self = this;
			var def = new $.Deferred();
			var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
			connection.rpc('/hw_local/get', {
				text: query,
				company_id: self.pos.company.id || 1
			}, { timeout: 7500 }).then(function(results){
				if (self.render_list(results)) {
					def.resolve();
				}else{
					def.reject();
				}
			})
			.catch(function(err){
				console.error('[proxy get]',err);
				self.gui.show_popup('error', {
					message: _t('Connection error'),
					comment: _t(
						'Can not execute this action because the POS is currently offline'
					)
				});
			});
		},
		delete_by_id: function(id) {
			var self = this;
			var def = new $.Deferred();
			var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
			connection.rpc('/hw_local/delete', {
				id: id
			}, { timeout: 7500 })
			.catch(function(err){
				console.error('[proxy get]',err);
				self.gui.show_popup('error', {
					message: _t('Connection error'),
					comment: _t(
						'Can not execute this action because the POS is currently offline'
					)
				});
			});
		},
		on_click_idelete: function(event) {
			var $line = $(event.target);
			var id = $line.data('order-id');
			this.delete_by_id(id)
			this.clear_search()
		},
		on_click_invoice: function(event) {
			var contents = this.$('.sale-orders-contents');
			contents.find('.highlight').removeClass('highlight');
			$(event.target)
				.closest('tr')
				.addClass('highlight');
		},
		render_list: function(invoices) {
			var self = this;
			var contents = this.$el[0].querySelector('.sale-orders-contents');
			contents.innerHTML = '';
			for (var i = 0, len = invoices.length; i < len; i++) {
				var order = invoices[i];
				var jsonOrder = JSON.parse(order.data);
				var partner_name = '';
				if(self.pos.db.get_partner_by_id(jsonOrder.partner_id)){
					partner_name = self.pos.db.get_partner_by_id(jsonOrder.partner_id).name;
				}
				var seller_name = '';
				if(jsonOrder.seller_id){
					self.pos.employees.forEach(function(employee){
						if(employee.id==jsonOrder.seller_id){
							seller_name = employee.name;
						}
					})
				}
				var invoiceline_html = QWeb.render('LocalOrdersLineWidget', {
					widget: this,
					orderId: order.id.trim(),
					order: jsonOrder,
					date: moment(order.created_date).format('DD/MM/YYYY HH:mm'),
					partner: partner_name,
					seller: seller_name
				});
				var invoiceline = document.createElement('tbody');
				invoiceline.innerHTML = invoiceline_html;
				invoiceline = invoiceline.childNodes[1];
				invoiceline.addEventListener('click', this.on_click_invoice);
				invoiceline.getElementsByClassName('delete-order')[0].addEventListener('click', this.on_click_idelete);
				contents.appendChild(invoiceline);
				$('.local_order_list-screen [data-order-id='+order.id.trim()+']').data('data',jsonOrder);
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
		},
		refresh: function(){
			this.perform_search(this.$('.searchbox input')[0].value);
		}
	});

	gui.define_screen({
		name: 'local_order_list_screen',
		widget: LocalOrdersListScreenWidget
	});

	var PrintDispatchScreenWidget = screens.ReceiptScreenWidget.extend({
		template: 'PrintDispatchScreenWidget',
		render_change: function() {},
		show: function(){
			this._super();
			this.$('.print_invoice').hide();
		},
		click_next: function() {
			this.gui.show_screen('products');
			this.pos.delete_current_order();
		},
		click_back: function() {
			//this._super();
			this.gui.show_screen('products');
			this.pos.delete_current_order();
		},
		print_xml: function() {
			var self = this;
			var receipt = QWeb.render('XmlDispatchTicket', this.get_receipt_render_env());
			//this.pos.proxy.print_dispatch(receipt);
			var connection = new Session(undefined, 'http://'+self.pos.config.ihw_url+':8069' || 'http://localhost:8069', { use_cors: true});
			connection.rpc('/hw_dispatch/print/', {receipt: receipt}, { timeout: 5000 });
		},
		render_receipt: function() {
			this.$('.pos-receipt-container').html(QWeb.render('DispatchTicket', this.get_receipt_render_env()));
		},
		get_receipt_render_env: function() {
			var self = this;
			var res = this._super();
			var order = this.pos.get_order();
			var receipt_screen_params = order.get_screen_data('params');
			res.order.getDate = function(){
				return moment().format('DD/MM/YYYY');
			};
			res.order.getDateHour = function(){
				return moment().format('DD/MM/YYYY HH:mm:ss');
			};
			res.order.getTemporalName = function(){
				return receipt_screen_params.tempName;
			};
			return res;
		},
		handle_auto_print: function() {
			if (this.should_auto_print()) {
				this.print();
				if (this.should_close_immediately()){
					this.click_next();
				}
			} else {
				this.lock_screen(false);
			}
		},
		should_auto_print: function() {
			return this.pos.config.iface_print_auto;
		},
		should_close_immediately: function() {
			return this.pos.config.iface_print_via_proxy && this.pos.config.iface_print_skip_screen;
		},
	});
	gui.define_screen({name:'print_dispatch', widget: PrintDispatchScreenWidget});

return {
	LocalOrdersListScreenWidget: LocalOrdersListScreenWidget,
};

});