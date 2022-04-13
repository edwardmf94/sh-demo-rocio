odoo.define('pos_psms.fuel_pumps', function (require) {
"use strict";

var PosBaseWidget = require('point_of_sale.BaseWidget');
var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var popups = require('point_of_sale.popups');
var core = require('web.core');
var rpc = require('web.rpc');

var QWeb = core.qweb;
var _t = core._t;

// At POS Startup, load the fuel pumps, and add them to the pos model
models.load_models({
    model: 'pos_psms.fuel_pump',
    fields: ['code','name','hose_ids'],
    domain: function(self){ return [['pos_config_id','=',self.config.id]]; },
    loaded: function(self,fuel_pumps){
        self.fuel_pumps = fuel_pumps;
        self.fuel_pumps_by_id = {};
        for (var i = 0; i < fuel_pumps.length; i++) {
            fuel_pumps[i].hoses = [];
            self.fuel_pumps_by_id[fuel_pumps[i].id] = fuel_pumps[i];
        }

        // Make sure they display in the correct order
        //self.fuel_pumps = self.fuel_pumps.sort(function(a,b){ return a.sequence - b.sequence; });

        // Ignore floorplan features if no floor specified.
        self.config.iface_fuelpump_plan = !!self.fuel_pumps.length;
    },
});

// At POS Startup, after the fuel pumps are loaded, load the hoses, and associate
// them with their fuel pump.
models.load_models({
    model: 'pos_psms.hose',
    fields: ['code','name','side','fuel_pump_id','product_id'],
    loaded: function(self,hoses){
        self.hoses_by_id = {};
        for (var i = 0; i < hoses.length; i++) {
            self.hoses_by_id[hoses[i].id] = hoses[i];
            var fuel_pump = self.fuel_pumps_by_id[hoses[i].fuel_pump_id[0]];
            if (fuel_pump) {
                fuel_pump.hoses.push(hoses[i]);
                hoses[i].fuel_pump = fuel_pump;
            }
        }
    },
});

// The Hose GUI element, should always be a child of the FuelPumpScreenWidget
var HoseWidget = PosBaseWidget.extend({
    template: 'HoseWidget',
    init: function(parent, options){
        this._super(parent, options);
        this.hose    = options.hose;
        this.selected = false;
        this.moved    = false;
        this.dragpos  = {x:0, y:0};
        this.handle_dragging = false;
        this.handle   = null;
    },
    // computes the absolute position of a DOM mouse event, used
    // when resizing tables
    event_position: function(event){
        if(event.touches && event.touches[0]){
            return {x: event.touches[0].screenX, y: event.touches[0].screenY};
        }else{
            return {x: event.screenX, y: event.screenY};
        }
    },
    // when a table is clicked, go to the table's orders
    // but if we're editing, we select/deselect it.
    click_handler: function(){
        var self = this;
        var fuel_pump_plan = this.getParent();
        /*if (floorplan.editing) {
            setTimeout(function(){  // in a setTimeout to debounce with drag&drop start
                if (!self.dragging) {
                    if (self.moved) {
                        self.moved = false;
                    } else if (!self.selected) {
                        self.getParent().select_table(self);
                    } else {
                        self.getParent().deselect_tables();
                    }
                }
            },50);
        } else {
            floorplan.pos.set_table(this.table);
        }*/
        fuel_pump_plan.pos.set_hose(this.hose);
    },
    hose_style_str: function(){
        return '';
    },
    // select the table (should be called via the floorplan)
    select: function() {
        this.selected = true;
        this.renderElement();
    },
    // deselect the table (should be called via the floorplan)
    deselect: function() {
        this.selected = false;
        this.renderElement();
        this.save_changes();
    },
    
    get_notifications: function(){  //FIXME : Make this faster
        //var orders = this.pos.get_hose_orders(this.hose);
        var notifications = {};
        notifications.printing = true;
        /*for (var i = 0; i < orders.length; i++) {
            if (orders[i].hasChangesToPrint()) {
                notifications.printing = true;
                break;
            } else if (orders[i].hasSkippedChanges()) {
                notifications.skipped  = true;
            }
        }*/
        return notifications;
    },
    update_click_handlers: function(editing){
        var self = this;
        this.$el.off('mouseup touchend touchcancel click dragend');

        if (editing) {
            this.$el.on('mouseup touchend touchcancel', function(event){ self.click_handler(event,$(this)); });
        } else {
            this.$el.on('click dragend', function(event){ self.click_handler(event,$(this)); });
        }
    },
    renderElement: function(){
        var self = this;
        this.order_count    = this.pos.get_hose_orders(this.hose).length;
        this.customer_count = this.pos.get_customer_count(this.hose);
        //this.fill           = Math.min(1,Math.max(0,this.customer_count / this.table.seats));
        this.notifications  = this.get_notifications();
        this._super();

        this.update_click_handlers();

        /*this.$el.on('dragstart', function(event,drag){ self.dragstart_handler(event,$(this),drag); });
        this.$el.on('drag',      function(event,drag){ self.dragmove_handler(event,$(this),drag); });
        this.$el.on('dragend',   function(event,drag){ self.dragend_handler(event,$(this),drag); });

        var handles = this.$el.find('.table-handle');
        handles.on('dragstart',  function(event,drag){ self.handle_dragstart_handler(event,$(this),drag); });
        handles.on('drag',       function(event,drag){ self.handle_dragmove_handler(event,$(this),drag); });
        handles.on('dragend',    function(event,drag){ self.handle_dragend_handler(event,$(this),drag); });*/
    },
});

// The screen that allows you to select the fuel pump, see and select the hose,
// as well as edit them.
var FuelPumpScreenWidget = screens.ScreenWidget.extend({
    template: 'FuelPumpScreenWidget',

    // Ignore products, discounts, and client barcodes
    barcode_product_action: function(code){},
    barcode_discount_action: function(code){},
    barcode_client_action: function(code){},

    init: function(parent, options) {
        this._super(parent, options);
        this.fuel_pump = this.pos.fuel_pumps[0];
        this.hose_widgets = [];
        this.selected_hose = null;
        this.editing = false;
    },
    hide: function(){
        this._super();
        if (this.editing) {
            this.toggle_editing();
        }
        this.chrome.widget.order_selector.show();
    },
    show: function(){
        this._super();
        this.chrome.widget.order_selector.hide();
        for (var i = 0; i < this.hose_widgets.length; i++) {
            this.hose_widgets[i].renderElement();
        }
        this.check_empty_fuel_pump();
    },
    click_fuel_pump_button: function(event,$el){
        var fuel_pump = this.pos.fuel_pumps_by_id[$el.data('id')];
        if (fuel_pump !== this.fuel_pump) {
            if (this.editing) {
                this.toggle_editing();
            }
            this.fuel_pump = fuel_pump;
            this.selected_hose = null;
            this.renderElement();
            this.check_empty_fuel_pump();
        }
    },
    background_image_url: function(floor) {
        return '/web/image?model=restaurant.floor&id='+floor.id+'&field=background_image';
    },
    get_fuel_pump_style: function() {
        var style = "";
        /*if (this.floor.background_image) {
            style += "background-image: url(" + this.background_image_url(this.floor) + "); ";
        }
        if (this.floor.background_color) {
            style += "background-color: " + _.escape(this.floor.background_color) + ";";
        }*/
        return style;
    },
    set_background_color: function(background) {
        var self = this;
        /*this.floor.background_color = background;
        rpc.query({
                model: 'restaurant.floor',
                method: 'write',
                args: [[this.floor.id], {'background_color': background}],
            })
            .fail(function (type, err){
                self.gui.show_popup('error',{
                    'title':_t('Changes could not be saved'),
                    'body': _t('You must be connected to the internet to save your changes.'),
                });
            });
        this.$('.floor-map').css({"background-color": _.escape(background)});*/
    },
    deselect_hoses: function(){
        for (var i = 0; i < this.hose_widgets.length; i++) {
            var hose = this.hose_widgets[i];
            if (hose.selected) {
                hose.deselect();
            }
        }
        this.selected_hose = null;
        this.update_toolbar();
    },
    select_hose: function(hose_widget){
        if (!hose_widget.selected) {
            this.deselect_hoses();
            hose_widget.select();
            this.selected_hose = hose_widget;
            this.update_toolbar();
        }
    },
    tool_shape_action: function(){
        if (this.selected_hose) {
            var hose = this.selected_hose.hose;
            if (hose.shape === 'square') {
                hose.shape = 'round';
            } else {
                hose.shape = 'square';
            }
            this.selected_hose.renderElement();
            this.update_toolbar();
        }
    },
    /*tool_colorpicker_open: function(){
        this.$('.color-picker').addClass('oe_hidden');
        if (this.selected_table) {
            this.$('.color-picker.fg-picker').removeClass('oe_hidden');
        } else {
            this.$('.color-picker.bg-picker').removeClass('oe_hidden');
        }
    },
    tool_colorpicker_pick: function(event,$el){
        if (this.selected_table) {
            this.selected_table.set_table_color($el[0].style['background-color']);
        } else {
            this.set_background_color($el[0].style['background-color']);
        }
    },
    tool_colorpicker_close: function(){
        this.$('.color-picker').addClass('oe_hidden');
    },
    tool_rename_table: function(){
        var self = this;
        if (this.selected_table) {
            this.gui.show_popup('textinput',{
                'title':_t('Table Name ?'),
                'value': this.selected_table.table.name,
                'confirm': function(value) {
                    self.selected_table.set_table_name(value);
                },
            });
        }
    },
    tool_change_seats: function(){
        var self = this;
        if (this.selected_table) {
            this.gui.show_popup('number',{
                'title':_t('Number of Seats ?'),
                'cheap': true,
                'value': this.selected_table.table.seats,
                'confirm': function(value) {
                    self.selected_table.set_table_seats(value);
                },
            });
        }
    },
    tool_duplicate_table: function(){
        if (this.selected_table) {
            var tw = this.create_table(this.selected_table.table);
            tw.table.position_h += 10;
            tw.table.position_v += 10;
            tw.save_changes();
            this.select_table(tw);
        }
    },
    tool_new_table: function(){
        var tw = this.create_table({
            'position_v': 100,
            'position_h': 100,
            'width': 75,
            'height': 75,
            'shape': 'square',
            'seats': 1,
        });
        tw.save_changes();
        this.select_table(tw);
        this.check_empty_floor();
    },*/
    new_hose_name: function(name){
        if (name) {
            var num = Number((name.match(/\d+/g) || [])[0] || 0);
            var str = (name.replace(/\d+/g,''));
            var n   = {num: num, str:str};
                n.num += 1;
            this.last_name = n;
        } else if (this.last_name) {
            this.last_name.num += 1;
        } else {
            this.last_name = {num: 1, str:'T'};
        }
        return '' + this.last_name.str + this.last_name.num;
    },
    /*create_table: function(params) {
        var table = {};
        for (var p in params) {
            table[p] = params[p];
        }

        table.name = this.new_table_name(params.name);

        delete table.id;
        table.floor_id = [this.floor.id,''];
        table.floor = this.floor;

        this.floor.tables.push(table);
        var tw = new TableWidget(this,{table: table});
            tw.appendTo('.floor-map .tables');
        this.table_widgets.push(tw);
        return tw;
    },
    tool_trash_table: function(){
        var self = this;
        if (this.selected_table) {
            this.gui.show_popup('confirm',{
                'title':  _t('Are you sure ?'),
                'comment':_t('Removing a table cannot be undone'),
                'confirm': function(){
                    self.selected_table.trash();
                },
            });
        }
    },*/
    toggle_editing: function(){
        this.editing = !this.editing;
        this.update_toolbar();
            this.update_hose_click_handlers();

        if (!this.editing) {
            this.deselect_hoses();
            }
        },
        update_hose_click_handlers: function(){
            for (var i = 0; i < this.hose_widgets.length; ++i) {
                if (this.editing) {
                    this.hose_widgets[i].update_click_handlers("editing");
                } else {
                    this.hose_widgets[i].update_click_handlers();
                }
        }
    },
    check_empty_fuel_pump: function(){
        if (!this.fuel_pump.hoses.length) {
            if (!this.editing) {
                this.toggle_editing();
            }
            this.$('.empty-fuel-pump').removeClass('oe_hidden');
        } else {
            this.$('.empty-fuel-pump').addClass('oe_hidden');
        }
    },
    update_toolbar: function(){

        /*if (this.editing) {
            this.$('.edit-bar').removeClass('oe_hidden');
            this.$('.edit-button.editing').addClass('active');
        } else {
            this.$('.edit-bar').addClass('oe_hidden');
            this.$('.edit-button.editing').removeClass('active');
        }

        if (this.selected_table) {
            this.$('.needs-selection').removeClass('disabled');
            var table = this.selected_table.table;
            if (table.shape === 'square') {
                this.$('.button-option.square').addClass('oe_hidden');
                this.$('.button-option.round').removeClass('oe_hidden');
            } else {
                this.$('.button-option.square').removeClass('oe_hidden');
                this.$('.button-option.round').addClass('oe_hidden');
            }
        } else {
            this.$('.needs-selection').addClass('disabled');
        }
        this.tool_colorpicker_close();*/
    },
    renderElement: function(){
        var self = this;

        // cleanup table widgets from previous renders
        for (var i = 0; i < this.hose_widgets.length; i++) {
            this.hose_widgets[i].destroy();
        }

        this.hose_widgets = [];

        this._super();

        for (var i = 0; i < this.fuel_pump.hoses.length; i++) {
            var tw = new HoseWidget(this,{
                hose: this.fuel_pump.hoses[i],
            });
            tw.appendTo(this.$('.fuel-pump-map .fuel_pumps'));
            this.hose_widgets.push(tw);
        }

        $('body').on('keyup', function (event) {
            if (event.which === $.ui.keyCode.ESCAPE) {
                if(self.editing) {
                    self.toggle_editing();
                }
            }
        });

        this.$('.fuel-pump-selector .button').click(function(event){
            self.click_fuel_pump_button(event,$(this));
        });

        /*this.$('.edit-button.shape').click(function(){
            self.tool_shape_action();
        });

        this.$('.edit-button.color').click(function(){
            self.tool_colorpicker_open();
        });

        this.$('.edit-button.dup-table').click(function(){
            self.tool_duplicate_table();
        });

        this.$('.edit-button.new-table').click(function(){
            self.tool_new_table();
        });

        this.$('.edit-button.rename').click(function(){
            self.tool_rename_table();
        });

        this.$('.edit-button.seats').click(function(){
            self.tool_change_seats();
        });

        this.$('.edit-button.trash').click(function(){
            self.tool_trash_table();
        });

        this.$('.color-picker .close-picker').click(function(event){
            self.tool_colorpicker_close();
            event.stopPropagation();
        });

        this.$('.color-picker .color').click(function(event){
            self.tool_colorpicker_pick(event,$(this));
            event.stopPropagation();
        });

        this.$('.edit-button.editing').click(function(){
            self.toggle_editing();
        });*/

        this.$('.fuel-pump-map,.fuel-pump-map .hoses').click(function(event){
            if (event.target === self.$('.fuel-pump-map')[0] ||
                event.target === self.$('.fuel-pump-map .hoses')[0]) {
                self.deselect_hoses();
            }
        });

        /*this.$('.color-picker .close-picker').click(function(event){
            self.tool_colorpicker_close();
            event.stopPropagation();
        });*/

        this.update_toolbar();
    },
});

gui.define_screen({
    'name': 'fuel_pumps',
    'widget': FuelPumpScreenWidget,
    'condition': function(){
        return this.pos.config.iface_fuelpump_plan;
    },
});

// Add the FuelPumpScreen to the GUI, and set it as the default screen
chrome.Chrome.include({
    build_widgets: function(){
        this._super();
        if (this.pos.config.iface_fuelpump_plan) {
            this.gui.set_startup_screen('fuel_pumps');
        }
    },
});

// New orders are now associated with the current table, if any.
var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
    initialize: function() {
        _super_order.initialize.apply(this,arguments);
        if (!this.hose) {
            this.hose = this.pos.hose;
        }
        this.customer_count = this.customer_count || 1;
        this.vehicle_plate = this.vehicle_plate || '';
        this.vehicle_driver = this.vehicle_driver || false;
        this.vehicle_odometer = this.vehicle_odometer || false;
        this.save_to_db();
    },
    export_as_JSON: function() {
        var json = _super_order.export_as_JSON.apply(this,arguments);
        json.hose     = this.hose ? this.hose.name : undefined;
        json.hose_id  = this.hose ? this.hose.id : false;
        json.fuel_pump     = this.hose ? this.hose.fuel_pump.name : false;
        json.fuel_pump_id  = this.hose ? this.hose.fuel_pump.id : false;
        json.customer_count = this.customer_count;
        json.vehicle_plate = this.get_vehicle_plate() ? this.get_vehicle_plate() : false;
        json.vehicle_driver = this.get_vehicle_driver() ? this.get_vehicle_driver() : false;
        json.vehicle_odometer = this.get_vehicle_odometer() ? this.get_vehicle_odometer() : false;
        return json;
    },
    init_from_JSON: function(json) {
        _super_order.init_from_JSON.apply(this,arguments);
        this.hose = this.pos.hoses_by_id[json.hose_id];
        this.fuel_pump = this.hose ? this.pos.fuel_pumps_by_id[json.fuel_pump_id] : undefined;
        this.customer_count = json.customer_count || 1;
        this.vehicle_plate = this.vehicle_plate ? this.vehicle_plate : undefined;
        this.vehicle_driver = this.vehicle_driver ? this.vehicle_driver : undefined;
        this.vehicle_odometer = this.vehicle_odometer ? this.vehicle_odometer : undefined;
    },
    export_for_printing: function() {
        var json = _super_order.export_for_printing.apply(this,arguments);
        json.hose = this.hose ? this.hose.name : undefined;
        json.fuel_pump = this.hose ? this.hose.fuel_pump.name : undefined;
        json.customer_count = this.get_customer_count();
        json.vehicle_plate = this.get_vehicle_plate() ? this.get_vehicle_plate() : false;
        json.vehicle_driver = this.get_vehicle_driver() ? this.get_vehicle_driver() : false;
        json.vehicle_odometer = this.get_vehicle_odometer() ? this.get_vehicle_odometer() : false;
        return json;
    },
    get_customer_count: function(){
        return this.customer_count;
    },
    set_customer_count: function(count) {
        this.customer_count = Math.max(count,0);
        this.trigger('change');
    },
    set_vehicle_plate: function(plate){
        this.set('vehicle_plate',plate);
    },
    set_vehicle_driver: function(driver){
        this.set('vehicle_driver',driver);
    },
    set_vehicle_odometer: function(odometer){
        this.set('vehicle_odometer',odometer);
    },
    get_vehicle_plate: function(){
        return this.get('vehicle_plate');
    },
    get_vehicle_driver: function(){
        return this.get('vehicle_driver');
    },
    get_vehicle_odometer: function(){
        return this.get('vehicle_odometer');
    },
});

// We need to modify the OrderSelector to hide itself when we're on
// the floor plan
chrome.OrderSelectorWidget.include({
    fuel_pump_button_click_handler: function(){
        this.pos.set_hose(null);
    },
    hide: function(){
        this.$el.addClass('oe_invisible');
    },
    show: function(){
        this.$el.removeClass('oe_invisible');
    },
    renderElement: function(){
        var self = this;
        this._super();
        if (this.pos.config.iface_fuelpump_plan) {
            if (this.pos.get_order()) {
                if (this.pos.hose && this.pos.hose.fuel_pump) {
                    this.$('.orders').prepend(QWeb.render('BackToFuelPumpButton',{hose: this.pos.hose, fuel_pump:this.pos.hose.fuel_pump}));
                    this.$('.fuel-pump-button').click(function(){
                        self.fuel_pump_button_click_handler();
                    });
                }
                this.$el.removeClass('oe_invisible');
            } else {
                this.$el.addClass('oe_invisible');
            }
        }
    },
});

// We need to change the way the regular UI sees the orders, it
// needs to only see the orders associated with the current table,
// and when an order is validated, it needs to go back to the floor map.
//
// And when we change the table, we must create an order for that table
// if there is none.
var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({
    initialize: function(session, attributes) {
        this.hose = null;
        return _super_posmodel.initialize.call(this,session,attributes);
    },

    /*transfer_order_to_different_table: function () {
        this.order_to_transfer_to_different_table = this.get_order();

        // go to 'floors' screen, this will set the order to null and
        // eventually this will cause the gui to go to its
        // default_screen, which is 'floors'
        this.set_table(null);
    },*/

    // changes the current hose.
    set_hose: function(hose) {
        if (!hose) { // no table ? go back to the floor plan, see ScreenSelector
            this.set_order(null);
        } else if (this.order_to_transfer_to_different_hose) {
            this.order_to_transfer_to_different_hose.hose = hose;
            this.order_to_transfer_to_different_hose.save_to_db();
            this.order_to_transfer_to_different_hose = null;

            // set this table
            this.set_hose(hose);

        } else {
            this.hose = hose;
            var orders = this.get_order_list();
            var product = this.db.get_product_by_id(hose.product_id[0]);
            if (orders.length) {
                var order_lines = orders[0].get_orderlines();
                var product_exists = false;
                if (order_lines.length>0){
                    for (var i=0;i<order_lines.length;i++){
                        if(order_lines[i].product.id==hose.product_id[0]){
                            product_exists = true;
                        }
                    }
				}
                if(!product_exists){
                    orders[0].add_product(product, {});
                }
                this.set_order(orders[0]); // and go to the first one ...
            } else {
                this.add_new_order();  // or create a new order with the current hose
                var orders = this.get_order_list();
                if (orders.length) {
                    orders[0].add_product(product, {});
                }
            }
        }
    },

    // if we have hoses, we do not load a default order, as the default order will be
    // set when the user selects a hose.
    set_start_order: function() {
        if (!this.config.iface_fuelpump_plan) {
            _super_posmodel.set_start_order.apply(this,arguments);
        }
    },

    // we need to prevent the creation of orders when there is no
    // hose selected.
    add_new_order: function() {
        if (this.config.iface_fuelpump_plan) {
            if (this.hose) {
                return _super_posmodel.add_new_order.call(this);
            } else {
                console.warn("WARNING: orders cannot be created when there is no active table in PSMS mode");
                return undefined;
            }
        } else {
            return _super_posmodel.add_new_order.apply(this,arguments);
        }
    },


    // get the list of unpaid orders (associated to the current table)
    get_order_list: function() {
        var orders = _super_posmodel.get_order_list.call(this);
        if (!this.config.iface_fuelpump_plan) {
            return orders;
        } else if (!this.hose) {
            return [];
        } else {
            var t_orders = [];
            for (var i = 0; i < orders.length; i++) {
                if ( orders[i].hose === this.hose) {
                    t_orders.push(orders[i]);
                }
            }
            return t_orders;
        }
    },

    // get the list of orders associated to a table. FIXME: should be O(1)
    get_hose_orders: function(hose) {
        var orders   = _super_posmodel.get_order_list.call(this);
        var t_orders = [];
        for (var i = 0; i < orders.length; i++) {
            if (orders[i].hose === hose) {
                t_orders.push(orders[i]);
            }
        }
        return t_orders;
    },

    // get customer count at table
    get_customer_count: function(hose) {
        var orders = this.get_hose_orders(hose);
        var count  = 0;
        for (var i = 0; i < orders.length; i++) {
            count += orders[i].get_customer_count();
        }
        return count;
    },

    // When we validate an order we go back to the floor plan.
    // When we cancel an order and there is multiple orders
    // on the table, stay on the table.
    on_removed_order: function(removed_order,index,reason){
        if (this.config.iface_fuelpump_plan) {
            var order_list = this.get_order_list();
            if( (reason === 'abandon' || removed_order.temporary) && order_list.length > 0){
                this.set_order(order_list[index] || order_list[order_list.length -1]);
            }else{
                // back to the floor plan
                this.set_hose(null);
            }
        } else {
            _super_posmodel.on_removed_order.apply(this,arguments);
        }
    },


});

var HoseGuestsButton = screens.ActionButtonWidget.extend({
    template: 'HoseGuestsButton',
    vehicle_plate: function() {
        if (this.pos.get_order()) {
            return this.pos.get_order().vehicle_plate;
        } else {
            return 0;
        }
    },
    button_click: function() {
        var self = this;
        /*this.gui.show_popup('number', {
            'title':  _t('Guests ?'),
            'cheap': true,
            'value':   this.pos.get_order().customer_count,
            'confirm': function(value) {
                value = Math.max(1,Number(value));
                self.pos.get_order().set_customer_count(value);
                self.renderElement();
            },
        });*/
        this.gui.show_popup('popup_vehicle');
    },
});

screens.OrderWidget.include({
    set_value: function(val) {
        var order = this.pos.get_order();
        if (order.get_selected_orderline()) {
            var mode = this.numpad_state.get('mode');
            if( mode === 'quantity'){
                order.get_selected_orderline().set_quantity(val);
            }else if( mode === 'discount'){
                order.get_selected_orderline().set_discount(val);
            }else if( mode === 'price'){
                var selected_orderline = order.get_selected_orderline();
                selected_orderline.price_manually_set = true;
                selected_orderline.set_unit_price(val);
            }else if( mode === 'price_total'){
                var quantity = order.get_selected_orderline().get_unit_price()>0 ? (val/order.get_selected_orderline().get_unit_price()): val;
                order.get_selected_orderline().set_quantity(quantity);
            }
        }
    },
});

screens.define_action_button({
    'name': 'guests',
    'widget': HoseGuestsButton,
    'condition': function(){
        //return this.pos.config.iface_fuelpump_plan;
        return !this.pos.vehicle_driver;
    },
});


var VehicleWidget = popups.extend({
    template: 'VehicleWidget',
    title: 'Información del vehiculo',
    init: function(){
        this._super(arguments[0],{})
    },
    show: function(options){
        var self = this;
        if(options==null) options = {};
        var order = this.pos.get_order();
        options.vehicle_plate = order.get_vehicle_plate();
        options.vehicle_driver = order.get_vehicle_driver();
        options.vehicle_odometer = order.get_vehicle_odometer();
        this._super(options);
        this.$el.find('[name=vehicle_plate]').focus();
    },
    close: function(){
        this._super();
    },
    click_confirm: function(){
        var self = this, order = self.pos.get_order();
        order.set_vehicle_plate(self.$el.find('[name=vehicle_plate]').val());
        order.set_vehicle_driver(self.$el.find('[name=vehicle_driver]').val());
        order.set_vehicle_odometer(self.$el.find('[name=vehicle_odometer]').val());
        self.gui.close_popup();
        self.gui.show_screen('payment');
        self.gui.show_screen('products');
    }
});
gui.define_popup({name:'popup_vehicle', widget: VehicleWidget});


/*var TransferOrderButton = screens.ActionButtonWidget.extend({
    template: 'TransferOrderButton',
    button_click: function() {
        this.pos.transfer_order_to_different_table();
    },
});

screens.define_action_button({
    'name': 'transfer',
    'widget': TransferOrderButton,
    'condition': function(){
        return this.pos.config.iface_fuelpump_plan;
    },
});*/

return {
    HoseGuestsButton: HoseGuestsButton,
    //VehicleWidget: VehicleWidget,
    //TransferOrderButton:TransferOrderButton,
    HoseWidget: HoseWidget,
    FuelPumpScreenWidget: FuelPumpScreenWidget,
};

});
