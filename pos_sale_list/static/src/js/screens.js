odoo.define('pos_sale_list.screens', function(require) {
    'use strict';

    var models = require('point_of_sale.models');
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
            self.$('[name=btnSales]').click(function() {
                self.gui.show_screen('SalesScreenWidget');
            });
            self.$('[name=btnSaleSave]').click(function() {
                self.gui.show_popup('save_sale_order');
            });
            if(!self.pos.config.pos_sale){
                self.$('[name=btnSales]').remove();
                self.$('[name=btnSaleSave]').remove();
            }
        }
    });

    var SalesScreenWidget = screens.ScreenWidget.extend({
        template: 'SalesScreenWidget',
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
                    self.load_from_backend(orderId, false);
                } else {
                    self.gui.show_popup('alert', {
                        title: _t('REQUIRED INFORMATION'),
                        body: _t('You must select an order to continue')
                    });
                }
            });

            this.$el.find('[name=btnSalePrint]').click(function() {
                var order = self.$('.sale-orders-contents .highlight');
                if (order.length > 0) {
                    var orderId = parseInt(order.attr('data-order-id'));
                    self.load_from_backend(orderId, true);
                } else {
                    self.gui.show_popup('alert', {
                        title: _t('REQUIRED INFORMATION'),
                        body: _t('You must select an order to continue')
                    });
                }
            });

            this.$el.find('[name=btnSaleCancel]').click(function() {
                var order = self.$('.sale-orders-contents .highlight');
                if (order.length > 0) {
                    self.gui.show_popup('confirm', {
                        title: _t('CONFIRM OPERATION'),
                        body: _t('The order will be canceled ') + order.attr('data-order-name'),
                        confirm: function() {
                            rpc
                                .query({
                                    model: 'sale.order',
                                    method: 'action_cancel',
                                    args: [
                                        parseInt(order.attr('data-order-id'))
                                    ]
                                })
                                .then(function(returned_value) {
                                    self.gui.show_screen('products');
                                    self.gui.show_popup('alert', {
                                        title: _t('COMPLETE CANCELLATION'),
                                        body: _t('The order was successfully canceled')
                                    });
                                });
                        }
                    });
                } else {
                    self.gui.show_popup('alert', {
                        title: _t('REQUIRED INFORMATION'),
                        body: _t('You must select an order to continue')
                    });
                }
            });

            this.$el.find('[name=btnAtender]').unbind('click').click(function(){
                var order = self.$('.sale-orders-contents .highlight');
                if (order.length > 0) {
                    self.gui.show_popup('confirm', {
                        title: _t('CONFIRM OPERATION'),
                        body:
                            _t('The order will be processed') + order.attr('data-order-name'),
                        confirm: function() {
                            rpc
                                .query({
                                    model: 'sale.order',
                                    method: 'get_shipped',
                                    args: [
                                        parseInt(order.attr('data-order-id'))
                                    ]
                                })
                                .then(function(returned_value) {
									self.gui.show_popup('alert', {
										title: _t('The order was attended'),
										body: _t('Order ')+order.find('td:first').html()+_t(' was served successfully')
									});
									order.find('td:last').html('<span style="color:red;">'+_t('Attended')+'</span>');
                                    order.data('saleorderShipped',true);
                                });
                        }
                    });
                } else {
                    self.gui.show_popup('alert', {
                        title: _t('REQUIRED INFORMATION'),
                        body: _t('You must select an order to continue')
                    });
                }
            });

            var search_timeout = null;

            this.$('.searchbox input').on('keyup', function(event) {
                if (event.keyCode == 13) {
                    var query = this.value;
                    self.perform_search(query);
                }
            });

            this.$('.searchbox .search-clear').click(function() {
                self.clear_search();
            });

            this.$('.searchbox input')
                .val('')
                .focus();
            
            this.$el.find('[name=sale_date]').datepicker({
                dateFormat:'yy-mm-dd',
                onSelect: function(dateText) {
                    var query = '';
                    self.perform_search(query, dateText);
                }
            });
        },
        show: function() {
            this._super();
            $('.pos_order_list-screen .subwindow.collapsed').hide();
            this.perform_search('');
        },
        perform_search: function(query,dateText) {
            this.load_orders(query,dateText);
        },
        clear_search: function() {
            this.load_orders();
            this.$('.searchbox input')[0].value = '';
            this.$('.searchbox input').focus();
        },
        load_orders: function(query,scheduled_date) {
            var self = this;
            var def = new $.Deferred();
            var fields = [
                'name',
                'date_order',
                'requested_date',
                'partner_id',
                'user_id',
                'employee_id',
                'amount_total',
                'state',
                'shipped_stock'
            ];
            var filter_query = [['name', 'ilike', query]];
            if(scheduled_date){
                var min_requested_date = moment(scheduled_date+' 00:00:00', 'YYYY/MM/DD hh:mm:ss').add(5, 'hours').format('YYYY-MM-DD hh:mm:ss');
                var max_requested_date = moment(scheduled_date+' 23:59:59', 'YYYY/MM/DD hh:mm:ss').add(5, 'hours').format('YYYY-MM-DD hh:mm:ss');
				filter_query = [
					['requested_date','>=',min_requested_date],
                    ['requested_date','<=',max_requested_date]
                ];
            }
            filter_query.push(['state','=','sale']);
            filter_query.push(['invoice_status','!=','invoiced']);

            rpc.query({
                    model: 'sale.order',
                    method: 'search_read',
                    domain: filter_query,
                    fields: fields,
                    limit: 80
			}).then(
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
                draft: _t('NEW'),
                sent: _t('SENT'),
                sale: _t('ORDERED'),
                done: _t('ACCOUNTING'),
                cancel: _t('CANCELED'),
            };
            var self = this;
            var contents = this.$el[0].querySelector('.sale-orders-contents');
            contents.innerHTML = '';
            for (var i = 0, len = invoices.length; i < len; i++) {
                var order = invoices[i];
                order.date_order = moment(order.date_order, 'YYYY-MM-DD hh:mm:ss')
                    .subtract(5, 'hours')
                    .format('DD/MM/YYYY hh:mm A');
                order.requested_date = moment(order.requested_date, 'YYYY-MM-DD hh:mm:ss')
                    .subtract(5, 'hours')
                    .format('DD/MM/YYYY');
                order.amount_total = order.amount_total.toFixed(2);
                order.state = states[order.state];
                var invoiceline_html = QWeb.render('SalesLineWidget', {
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
        },
        load_from_backend: function(orderId, print) {
            var self = this;
            var orderPos = false;
            if(!print){
                orderPos = self.pos.get_order();
                orderPos.destroy();
                orderPos = self.pos.get_order();
            }
            rpc.query({
                model: 'sale.order',
                method: 'load_from_ui',
                args: [parseInt(orderId)]
            })
            .then(function(data) {
                if(!print){
                    var client;
                    $.each(data.order_line, function() {
                        var line = this;
                        var product = self.pos.db.get_product_by_id(line.product_id[0]);
                        var price_unit = line.price_unit;
                        if(price_unit==0){
                            self.pos.bonification = true;
                            price_unit = product.get_price(orderPos.pricelist, 1);
                        }
                        orderPos.add_product(product, {
                            price: price_unit,
                            quantity: line.product_uom_qty,
                            discount: line.discount,
                            merge: false
                        });
                        var selected_orderline = orderPos.get_selected_orderline();
                        selected_orderline.price_manually_set = true;
                    });
                    if (data.partner_id) {
                        client = self.pos.db.get_partner_by_id(data.partner_id);
                        if (!client) {
                            console.error(
                                'ERROR: trying to load a partner not available in the pos'
                            );
                        }
                    } else {
                        client = null;
                    }
                    orderPos.set_sale_order(parseInt(orderId));
                    orderPos.set_client(client);
                    orderPos.set_note_sale(data.note);
					orderPos.set_seller_id(data.seller_id);

                    self.gui.show_screen('products');
                }else{
                    data._date = moment().format('DD/MM/YYYY HH:mm');
                    self.gui.show_screen('sale_print',{order: data});
                }
            });
        }
    });

    gui.define_screen({
        name: 'SalesScreenWidget',
        widget: SalesScreenWidget
    });

	var SalePrintScreenWidget = screens.ReceiptScreenWidget.extend({
        template: 'SalePrintScreenWidget',
        render_change: function() {},
        show: function(){
            this._super();
            this.$('.print_invoice').hide();
        },
        click_next: function() {},
        click_back: function() {
            this._super();
            this.gui.show_screen('products');
        },
        get_receipt_render_env: function() {
            var self = this;
            var res = this._super();
            var receipt_screen_params = this.pos
                .get_order()
                .get_screen_data('params');
            if (receipt_screen_params) {
                if (receipt_screen_params.order) {
                    res.order = receipt_screen_params.order;
                    res.order.get_client_name_xml = function(){
                        var client_name = this.partner_name;
                        if(client_name!=''){
                            client_name = client_name.split('ñ').join('n');
                            client_name = client_name.split('Ñ').join('N');
                        }
                        return client_name;
                    };
                    res.order.order_line.forEach(function(line,i){
                        line.get_product_xml = function(){
                            var product_name = this.name;
                            if(product_name!=''){
                                product_name = product_name.split('ñ').join('n');
                                product_name = product_name.split('Ñ').join('N');
                            }
                            return product_name;
                        };
                        res.order.order_line[i] = line;
                    });
                }
            }
            return res;
        },
        render_receipt: function() {
            this.$('.pos-receipt-container').html(
                QWeb.render('SalePrint', this.get_receipt_render_env())
            );
        },
        print_xml: function() {
            var receipt = QWeb.render('XmlSalePrint', this.get_receipt_render_env());
            this.pos.proxy.print_receipt(receipt);
            this.pos.get_order()._printed = true;
        },
    });
    gui.define_screen({name:'sale_print', widget: SalePrintScreenWidget});

    return {
        SalePrintScreenWidget: SalePrintScreenWidget,
        SalesScreenWidget: SalesScreenWidget,
    };
});