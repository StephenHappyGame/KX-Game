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
        avatarItem: cc.Prefab,
        content: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    updatePlayerInfo () {
        this.avatar.node.active = false;
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), this.avatar, function () {
            this.avatar.node.active = true;
        }.bind(this));
    },

    start () {
        this.updatePlayerInfo();

        this.items = [];
        for (let i = 0; i < 16; i ++) {
            let data = {
                callback: function (index) {
                    cc.log(index);
                    for (let j = 0; j < this.items.length; j ++) {
                        this.items[j].getComponent('AvatarItem').hideSelect();
                        if (j === index) {
                            this.items[j].getComponent('AvatarItem').showSelect();
                        }
                    }

                    Global.DialogManager.addLoadingCircle();
                    Global.API.hall.changeAvatarRequest('UserInfo/head_' + index, function (msg) {
                        Global.DialogManager.removeLoadingCircle();
                    })
                }.bind(this),
                icon: 'UserInfo/head_' + i
            };
            
            let item = cc.instantiate(this.avatarItem);
            item.parent = this.content;
            item.getComponent('AvatarItem').updateUI(data, i);
            item.getComponent('AvatarItem').hideSelect();
            if (Global.Player.getPy('avatar') === ('UserInfo/head_' + i)) {
                item.getComponent('AvatarItem').showSelect();
            }

            this.items[this.items.length] = item;
        }

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
    }

    // update (dt) {},
});
