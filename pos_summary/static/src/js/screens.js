odoo.define('pos_summary.screens', function(require) {
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
			self.$el.find('[name=btnRes]').click(function(){
				if (!self.pos.config.allow_summary_control) {
					return self.gui.show_screen('SummaryWidget');
				}
				if (self.pos.get_cashier().role === 'manager') {
					self.gui.show_screen('SummaryWidget');
				} else {
					self.gui.show_popup('error', {
						title: _t('Permisos insuficientes'),
						body: _t('El usuario no puede acceder al resumen debido a falta de permisos!')
					});
				}
			});
			if(!self.pos.config.allow_summary_session){
				self.$el.find('[name=btnRes]').remove();
			}
			self.$el.find('[name=btnOldRes]').click(function(){
				if (!self.pos.config.allow_summary_control) {
					return self.gui.show_screen('OldSummaryWidget');
				}
				if (self.pos.get_cashier().role === 'manager') {
					self.gui.show_screen('OldSummaryWidget');
				} else {
					self.gui.show_popup('error', {
						title: _t('Permisos insuficientes'),
						body: _t('El usuario no puede acceder al resumen debido a falta de permisos!')
					});
				}
			});
			if(!self.pos.config.allow_summary_all_session){
				self.$el.find('[name=btnOldRes]').remove();
			}
		}
	});

	var SummaryWidget = screens.ReceiptScreenWidget.extend({
		template: 'SummaryWidget',
		click_next: function () {
			this.gui.show_screen('products');
		},
		click_back: function () {
			this.gui.show_screen('products');
		},
		data: null,
		show: function () {
			this._super();
			var self = this;
			var data = self.gui.get_current_screen_param('data');
			var old = self.gui.get_current_screen_param('old');
			if (data) {
				self.data = data;
				self.$('.pos-receipt-container').html(
					QWeb.render('SummaryReceipt', {
						widget: self,
						pos: self.pos,
						ss: data
					})
				);
			} else {
				rpc
					.query({
						model: 'pos.session',
						method: 'get_summary',
						args: [old ? parseInt(old) : self.pos.pos_session.id],
						kwargs: {}
					})
					.then(function (response) {
						self.data = response.data;
						self.$('.pos-receipt-container').html(
							QWeb.render('SummaryReceipt', {
								widget: self,
								pos: self.pos,
								ss: response.data
							})
						);
					})
			}
		},
		should_auto_print: function () {
			return false;
		},
		print_web: function () {
			window.print();
		},
		print: function () {
			var self = this;
			this.lock_screen(true);
			setTimeout(function () {
				self.lock_screen(false);
			}, 1000);
			this.print_web();
		},
	});

	gui.define_screen({
		name: 'SummaryWidget', 
		widget: SummaryWidget 
	});


	var OldSessionsScreenWidget = screens.ScreenWidget.extend({
		template: 'OldSessionsScreenWidget',
		show: function () {
			var self = this;
			this._super();
			if (this.$el) {
				this.$el.removeClass('oe_hidden');
			}
			this.renderElement();
			this.$('.back').click(function () {
				self.gui.show_screen('products');
			});

			this.$('.order-list-contents').delegate(
				'.order-line .print',
				'click',
				function (event) {
					self.gui.show_screen('SummaryWidget', {
						old: $(this).attr('data-id')
					});
				}
			);

			if (
				this.pos.config.iface_vkeyboard &&
				this.pos_widget.onscreen_keyboard
			) {
				this.pos_widget.onscreen_keyboard.connect(this.$('.searchbox input'));
			}

			this.$('[name=fecha]').change(function () {
				var value = self.$('.searchbox input').val();
				self.perform_search(value, true);
			});
			this.$('[name=btnDia]')
				.unbind('click')
				.click(function () {
					var query = self.$('[name=fecha]').val();
					rpc
						.query({
							model: 'pos.session',
							method: 'get_info_session_day',
							args: [self.pos.config.id, moment(query).format('YYYY-MM-DD')],
							kwargs: { }
						})
						.then(
							function (sessions) {
								self.gui.show_screen('SummaryWidget', {
									data: sessions
								});
							},
						);
				});
			if (this.$el) {
				this.$el.removeClass('oe_hidden');
			}
		},
		perform_search: function (query, associate_result) {
			if (query) {
				var self = this;
				var filter_query = [
					['config_id', '=', self.pos.config.id],
					['start_at', '>=', moment(query).format('YYYY-MM-DD') + ' 05:00:00'],
					[
						'start_at',
						'<=',
						moment(query)
							.add(1, 'days')
							.format('YYYY-MM-DD') + ' 04:59:59'
					]
				];
				rpc
					.query({
						model: 'pos.session',
						method: 'search_read',
						args: [],
						kwargs: {
							fields: ['name', 'start_at', 'stop_at', 'user_id'],
							domain: filter_query,
						}
					})
					.then(
						function (sessions) {
							self.render_list(sessions);
						},
						function (err, event) {
							event.preventDefault(); /*def.reject();*/
						}
					);
			}
		},
		clear_search: function () {
			this.$('.searchbox input')[0].value = '';
			this.$('.searchbox input').focus();
		},
		render_list: function (sessions) {
			var contents = this.$el[0].querySelector('.order-list-contents');
			contents.innerHTML = '';
			sessions.forEach(function (item) {
				item.start_at = moment(item.start_at)
					.subtract(5, 'hours')
					.format('YYYY-MM-DD HH:mm');
				item.stop_at = moment(item.stop_at)
					.subtract(5, 'hours')
					.format('YYYY-MM-DD HH:mm');
				var clientline_html = QWeb.render('OldSessionLine', {
					widget: this,
					session: item
				});
				var clientline = document.createElement('tbody');
				clientline.innerHTML = clientline_html;
				clientline = clientline.childNodes[1];
				contents.appendChild(clientline);
			});
		},
		close: function () {
			this._super();
		},
		renderElement: function () {
			this._super();
		}
	});

	gui.define_screen({
		name: 'OldSummaryWidget',
		widget: OldSessionsScreenWidget
	});

	return {
		SummaryWidget: SummaryWidget,
		OldSessionsScreenWidget: OldSessionsScreenWidget,
	}

});