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
        Global.API.hall.getGameRecordDataRequest({kind: Global.Enum.gameType.DZ, uid: Global.Player.uid}, {createTime: -1}, function (data) {
            for (let i = 0; i < data.msg.recordArr.length; ++i){
                let record = data.msg.recordArr[i];
                let node = cc.instantiate(this.itemNode);
                node.getChildByName("drawID").getComponent(cc.Label).string = record.drawID || "";
                let roomName = "";
                if (record.roomLevel === 1){
                    roomName = "体验房";
                }else if (record.roomLevel === 2){
                    roomName = "初级房";
                }else if (record.roomLevel === 3){
                    roomName = "中级房";
                }else if (record.roomLevel === 4){
                    roomName = "高级房";
                }else if (record.roomLevel === 5){
                    roomName = "财大气粗";
                }else if (record.roomLevel === 6){
                    roomName = "腰缠万贯";
                }else if (record.roomLevel === 7){
                    roomName = "挥土如金";
                }else if (record.roomLevel === 8){
                    roomName = "富贵逼人";
                }
                node.getChildByName("roomLevel").getComponent(cc.Label).string = roomName;

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
