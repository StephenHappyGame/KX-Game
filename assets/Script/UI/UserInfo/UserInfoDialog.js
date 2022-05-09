// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        avatar: cc.Sprite,
        nicknameText: cc.Label,
        idText: cc.Label,
        goldNumText: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    updatePlayerInfo: function () {
        this.avatar.node.active = false;
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), this.avatar, function () {
            this.avatar.node.active = true;
        }.bind(this));

        this.nicknameText.string = Global.Player.convertNickname(Global.Player.getPy('nickname'));
        this.idText.string = '账号ID：' + Global.Player.getPy('uid');
        this.goldNumText.string = Global.Player.getPy('gold');
    },

    start () {
        this.updatePlayerInfo();
        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
    },

    onDestroy () {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    },

    messageCallbackHandler: function(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.updatePlayerInfo();
                break;
        }
    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
            case 'changeAvatar':
                Global.DialogManager.createDialog('UserInfo/ChangeAvatarDialog');
                break;
            case 'setting':
                Global.DialogManager.createDialog('Setting/SettingDialog');
                break;
            case 'register':
                Global.DialogManager.createDialog('Login/RegisterDialog');
                break;
            case 'logout':
                Global.NetworkLogic.disconnect(false);
                Global.DialogManager.destroyAllDialog();
                Global.DialogManager.createDialog('Login/LoginDialog', {logoutEvent: true});
                break;
        }

        // Global.AudioManager.playCommonSoundClickButton();
    },

    // update (dt) {},
});
