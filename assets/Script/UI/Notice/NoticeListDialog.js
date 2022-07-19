cc.Class({
    extends: cc.Component,

    properties: {
        listItem: cc.Prefab,
        content: cc.Node,
        noticeListRedPoint: cc.Node
    },

    updatePlayerInfo() {
        this.noticeListRedPoint.active = Global.Player.checkUnRead() !== 0;
    },

    start () {
        let data = Global.Player.getPy('emailArr');
        if(!!data && data.length > 0) {
            data = JSON.parse(data);
        } else{
            data = [];
        }

        for(let i = data.length - 1; i >= 0; i --) {
            let mailData = data[i];
            let item = cc.instantiate(this.listItem);
            item.parent = this.content;
            item.getComponent('NoticeListItem').updateUI(mailData);
        }
        this.updatePlayerInfo();

        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
    },

    onDestroy() {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    },

    messageCallbackHandler(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.updatePlayerInfo();
                break;
        }
    },

    onBtnClk(event, param) {
        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
        }
    }
});
