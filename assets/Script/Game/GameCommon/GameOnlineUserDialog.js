let roomProto = require('../../API/RoomProto');
let roomAPI = require('../../API/RoomAPI');

cc.Class({
    extends: cc.Component,

    properties: {
        shenSuanZiItem: cc.Node,
        fuhao1Item: cc.Node,
        fuhaoItem: cc.Node
    },

    start() {
        Global.MessageCallback.addListener('RoomMessagePush', this);

        roomAPI.roomMessageNotify(roomProto.getRoomOnlineUserInfoNotify());
    },

    onDestroy() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
    },

    buttonEventClose() {
        Global.DialogManager.destroyDialog(this);
    },

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.GET_ROOM_ONLINE_USER_INFO_PUSH) {
                if (!!msg.data.shenSuanZiInfo) this.setItemInfo(this.shenSuanZiItem, msg.data.shenSuanZiInfo);
                for (let i = 0; i < msg.data.fuHaoUserInfoArr.length; ++i){
                    if (i === 0) this.setItemInfo(this.fuhao1Item, msg.data.fuHaoUserInfoArr[i]);
                    else{
                        let item = cc.instantiate(this.fuhaoItem);
                        this.setItemInfo(item, msg.data.fuHaoUserInfoArr[i]);
                        this.setItemNumber(item, i + 1);
                    }
                }
            }
        }
    },

    setItemInfo(item, info){
        item.parent = this.fuhaoItem.parent;
        item.active = true;
        item.getChildByName("nickname").getComponent(cc.Label).string = Global.Player.convertNickname(info.userInfo.nickname);
        item.getChildByName("gold").getComponent(cc.Label).string = info.userInfo.gold.toFixed(2);
        item.getChildByName("winCount").getComponent(cc.Label).string = info.winCount + "局";
        item.getChildByName("betCount").getComponent(cc.Label).string = info.betCount.toFixed(2) + "元";
        Global.CCHelper.updateSpriteFrame(info.userInfo.avatar, item.getChildByName("head_sprite").getComponent(cc.Sprite));
    },

    setItemNumber(item, number){
        item.getChildByName("fuhaoNumber").getComponent(cc.Label).string = number.toString();
    }
});
