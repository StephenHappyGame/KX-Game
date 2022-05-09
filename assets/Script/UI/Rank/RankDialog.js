cc.Class({
    extends: cc.Component,

    properties: {
        rankItem: cc.Prefab,
        content: cc.Node,

        myAvatar: cc.Sprite,
        myGold: cc.Label,
        myNickname: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    onScrollEvent: function (target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                this.updateList();
                break;
        }
    },

    updateList () {
        Global.DialogManager.addLoadingCircle();
        Global.API.hall.getTodayWinGoldCountRankRequest(this.startIndex, this.perCount, function (msg) {
            let data = msg.msg.rankList;
            for (let i = 0; i < data.length; i ++) {
                let item = cc.instantiate(this.rankItem);
                item.parent = this.content;
                item.getComponent('RankItem').updateUI(data[i], this.startIndex + i + 1);
            }

            if (data.length > 0) {
                this.startIndex += this.perCount;
            }
            Global.DialogManager.removeLoadingCircle();
        }.bind(this));
    },

    start () {
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), this.myAvatar);
        this.myGold.string = Global.Player.getPy('todayWinGoldCount').toFixed(2);
        this.myNickname.string = Global.Player.convertNickname(Global.Player.getPy('nickname'));

        this.startIndex = 0;
        this.perCount = 10;
        this.maxCount = false;

        this.updateList();
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
