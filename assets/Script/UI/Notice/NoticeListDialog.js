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

        listItem: cc.Prefab,
        content: cc.Node,
        noticeListRedPoint: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    updatePlayerInfo () {
        this.noticeListRedPoint.active = Global.Player.checkUnRead() !== 0;
    },

    start () {
        let data = Global.Player.getPy('emailArr');
        if (!!data && data.length > 0){
            data = JSON.parse(data);
        }else{
            data = [];
        }
        for (let i = data.length - 1; i >= 0; i --) {
            let mailData = data[i];
            let item = cc.instantiate(this.listItem);
            item.parent = this.content;
            item.getComponent('NoticeListItem').updateUI(mailData);
        }
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
        }
    },

    // update (dt) {},
});
