import Mixin from './mixin';
import Logger from './logger';
import Listener from './listener';
import Emitter from './emitter';
import SocketIO from 'socket.io-client';

const version = 3;

export default class VueSocketIO {

    /**
     * lets take all resource
     * @param io
     * @param vuex
     * @param debug
     * @param options
     */
    constructor({ connection, vuex, debug, autoConnect, options, isMiniProgram=false }) {

        Logger.debug = debug;
        this.connection = connection;
        this.moptions = options;
        this.autoConnect = autoConnect;
        this.isMiniProgram=isMiniProgram;
        if (autoConnect) {
            this.io = this.connect(connection, options);
            this.emitter = new Emitter(vuex);
            this.listener = new Listener(this.io, this.emitter);
        }
        else {
            this.vuex = vuex
        }

    }

    /**
     * Vue.js entry point
     * @param Vue
     */
    install(Vue) {

        this._vm = Vue

        if (version <= +Vue.version.split('.')[0]) {
            Vue.config.globalProperties.$vueSocketIo = this;
        } else {
            Vue.prototype.$vueSocketIo = this;
        }
        if (this.autoConnect) {
            if (version <= +Vue.version.split('.')[0]) {
                Vue.provide('socket', this.io)
                Vue.config.globalProperties.$socket = this.io;
            } else {
                Vue.prototype.$socket = this.io;
            }
            Vue.mixin(Mixin);
            Logger.info('Vue-Socket.io plugin enabled');
        }


    }


    /**
     * registering SocketIO instance
     * @param connection
     * @param options
     */
    connect(connection, options) {

        if (connection && typeof connection === 'object') {

            Logger.info('Received socket.io-client instance');

            return connection;

        } else if (typeof connection === 'string') {

            Logger.info('Received connection string');

            if(this.isMiniProgram){
                const MpSocketIO = require('socket.io-mp-client');
                return this.io = MpSocketIO(connection, options);
            }
            else{
                return this.io = SocketIO(connection, options);
            }


        } else {

            throw new Error('Unsupported connection type');

        }

    }

    createConnect() {
        let options = JSON.parse(JSON.stringify(this.moptions))
        if (!this.autoConnect) {
            if (this.moptions.query != undefined && this.moptions.query.token != undefined && typeof this.moptions.query.token == "function") {
                options.query.token = this.moptions.query.token();
            }
            this.io = this.connect(this.connection, options);
            if (version <= +this._vm.version.split('.')[0]) {
                this._vm.provide('socket', this.io)
                this._vm.config.globalProperties.$socket = this.io;
            } else {
                this._vm.prototype.$socket = this.io;
            }
            this.emitter = new Emitter(this.vuex);
            this.listener = new Listener(this.io, this.emitter);
            this._vm.mixin(Mixin);
            Logger.info('Vue-Socket.io plugin enabled');

        }
    }

}
