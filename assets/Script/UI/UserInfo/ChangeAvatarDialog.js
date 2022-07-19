cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        avatarItem: cc.Prefab,
        content: cc.Node
    },

    updatePlayerInfo () {
        this.avatar.node.active = false;
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), this.avatar, function () {
            this.avatar.node.active = true;
        }.bind(this));
    },

    start () {
        this.updatePlayerInfo();

        this.items = [];
        for (let i = 0; i < 12; i ++) {
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
});
