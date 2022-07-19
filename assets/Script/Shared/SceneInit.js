const Translator = require('Translator');

/**
 * @category Core
 * @name SceneInit
 * @classdesc Main script used to initialize the scene and all core components.
 * 
 * @class 
 * @extends cc.Component
 */
cc.Class({
    extends: cc.Component,

    properties: {
        /**
         * To be honest, I have no idea how is it supposed to work
         * 
         * @type { string }
         * @memberof SceneInit#
         */
        sceneType: '',

        /**
         * Object that will display startup text.
         * 
         * @type { cc.Label }
         * @memberof SceneInit#
         */
        initText: cc.Label,

        /**
         * Group of objects that is displayed at loading and will be destroyed after that.
         * 
         * @type { cc.Node }
         * @memberof SceneInit#
         */
        initGroup: cc.Node
    },

    /**
     * Initializes *Global* object, by assigning all required components onto it.
     * 
     * @memberof SceneInit#
     * @see {@link Global}
     */
    initGlobal: function() {
        this.initText.string = 'Initializing...';

        Global.Constant = require('./Constant');
        Global.MessageCallback = require('./MessageCallback');
        Global.DialogManager = require('./DialogManager');
        Global.AudioManager = require('./AudioManager');
        Global.NetworkManager = require('./NetworkManager');

        Global.CCHelper = require('./CCHelper');
        Global.Utils = require('./utils');

        Global.NetworkLogic = require('./NetworkLogic');

        Global.Enum = require('./enumeration');
        Global.Code = require('./code');

        Global.API = require('./Api');

        Global.Player = require('../Models/Player');
        Global.PlayerWechat = require('../Models/PlayerWechat');
        Global.GameTypes = require('../Models/GameTypes');
        Global.Data = require('../Models/Data');

        Global.Animation = require('./Animation');
        Global.AgentProfit = require('../Models/AgentProfit');
    },

    /**
     * Initializes all essential systems, starts global events and enters the game.
     * 
     * @memberof SceneInit#
     */
    onLoad: function () {
        const savedLanguage = cc.sys.localStorage.getItem('language') || 'en';
        Translator.init(savedLanguage);

        console.log(`Game starting with language ${savedLanguage}`);

        // 初始设置
        cc.debug.setDisplayStats(true);
        //cc.game.setFrameRate(30);
        // 初始化全局变量
        this.initGlobal();
        // 适配处理
        Global.CCHelper.screenAdaptation(new cc.Size(1280, 720), this.node.getComponent(cc.Canvas));

        // 初始化界面管理器
        Global.DialogManager.init(this.node);

        //音乐音效初始化
        Global.AudioManager.init();

        // 初始化网络
        Global.NetworkLogic.init();

        cc.game.on(cc.game.EVENT_HIDE, this.onEventHide.bind(this));
        cc.game.on(cc.game.EVENT_HIDE, this.onEventShow.bind(this));

        if (false && cc.sys.isNative) {
            Global.DialogManager.createDialog('Update/UpdateDialog', {cb: function () {
                this.enterGame();
            }.bind(this)});
        } else {
            this.enterGame();
        }
    },

    /**
     * Stops global events and deinitializes *NetworkLogic*.
     * 
     * @memberof SceneInit#
     * @see {@link module:NetworkLogic.deInit}
     */
    onDestroy: function () {
        cc.game.off(cc.game.EVENT_HIDE, this.onEventHide.bind(this));
        cc.game.off(cc.game.EVENT_HIDE, this.onEventShow.bind(this));

        Global.NetworkLogic.deInit();
    },

    /**
     * Emits **cc.game.EVENT_HIDE** to **GAME_EVENT** route.
     * 
     * @memberof SceneInit#
     * @see {@link module:MessageCallback.emitMessage}
     */
    onEventHide: function () {
        Global.MessageCallback.emitMessage("GAME_EVENT", cc.game.EVENT_HIDE);
    },

    /**
     * Emits **cc.game.EVENT_SHOW** to **GAME_EVENT** route.
     * 
     * @memberof SceneInit#
     * @see {@link module:MessageCallback.emitMessage}
     */
    onEventShow: function () {
        Global.MessageCallback.emitMessage("GAME_EVENT", cc.game.EVENT_SHOW);
    },

    /**
     * Creates *LoginDialog* and removes initial loading screen on success.
     * 
     * @memberof SceneInit#
     * @see {@link module:DialogManager.createDialog}
     */
    enterGame: function () {
        let cb = function () {
            this.initGroup.destroy();
        }.bind(this);

        if (Global.CCHelper.isWechatBrowser()) {
            // I have no idea how locationParams is supposed to work, when it's undefined in this object
            Global.GameTypes.setState(this.locationParams.state);
            Global.DialogManager.createDialog('Login/LoginDialog', null, cb);
        } else {
            Global.GameTypes.setState(this.sceneType);
            Global.DialogManager.createDialog('Login/LoginDialog', null, cb);
        }
    }
});
