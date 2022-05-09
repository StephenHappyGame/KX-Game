cc.Class({
    extends: cc.Component,

    properties: {
        contentNode: cc.Node,
        itemNode: cc.Node,
        winColor: cc.Color,
        lostColor: cc.Color
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        Global.API.hall.getGameRecordDataRequest({kind: Global.Enum.gameType.BRNN, uid: Global.Player.uid}, {createTime: -1}, function (data) {
            for (let i = 0; i < data.msg.recordArr.length; ++i){
                let record = data.msg.recordArr[i];
                let node = cc.instantiate(this.itemNode);
                node.getChildByName("drawID").getComponent(cc.Label).string = record.drawID || "";
                node.getChildByName("roomLevel").getComponent(cc.Label).string = "大师场";

                let winGoldLabel = node.getChildByName("winGold").getComponent(cc.Label);
                if(record.changeGold > 0){
                    winGoldLabel.node.color = this.winColor;
                    winGoldLabel.string = "+" + Global.Utils.formatNumberToString(record.changeGold, 2);
                }else{
                    winGoldLabel.node.color = this.lostColor;
                    winGoldLabel.string = Global.Utils.formatNumberToString(record.changeGold, 2);
                }

                node.getChildByName("gameTime").getComponent(cc.Label).string = new Date(record.createTime).format("yyyy-MM-dd hh:mm:ss");

                node.active = true;
                node.parent = this.contentNode;
            }
        }.bind(this));
    },

    onClose: function () {
        Global.DialogManager.destroyDialog(this, true);
    }

    // update (dt) {},
});
