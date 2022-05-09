let gameProto = require('./LHDProto');

cc.Class({
    extends: cc.Component,

    properties: {
        trendItemController: require("LHDTrendItem"),
        betRecordItemNode: cc.Node,
        longWinPercentLabel: cc.Label,
        huWinPercentLabel: cc.Label
    },

    start () {
        this.recordTypeNode = [];

        this.initDialog(this.dialogParameters.dirRecordArr);

        Global.MessageCallback.addListener('UpdateTrendDataNotify', this);
    },

    onDestroy: function () {
        Global.MessageCallback.removeListener('UpdateTrendDataNotify', this);
    },

    messageCallbackHandler(router, msg) {
        if (router === 'UpdateTrendDataNotify') {
            this.initDialog(msg.dirRecordArr);
        }
    },

    buttonEvent(event, param){
        if (param === "close"){
            Global.DialogManager.destroyDialog(this, true);
        }
    },

    initDialog(dirRecordArr){
        this.trendItemController.init(dirRecordArr);
        this.addDirRecord(dirRecordArr);
        let longWinCount = 0;
        let huWinCount = 0;
        for (let i = 0; i < dirRecordArr.length; ++i){
            if (dirRecordArr[i] === gameProto.LONG) longWinCount++;
            else if (dirRecordArr[i] === gameProto.HU) huWinCount++;
        }

        this.updateWinPercent(longWinCount, huWinCount);
    },

    addDirRecord(dirRecordList){
        for (let i = 0; i < this.recordTypeNode.length; ++i){
            this.recordTypeNode[i].destroy();
        }
        this.recordTypeNode = [];
        // 直接出现
        for(let i = 0; i < dirRecordList.length; ++i){
            let node = this.createBetRecordItem(dirRecordList[i]);
            node.parent = this.betRecordItemNode.parent;
            node.x = this.betRecordItemNode.x + i * this.betRecordItemNode.width;
            node.y = 0;
            this.recordTypeNode.push(node);
        }
    },

    createBetRecordItem(type){
        let res = "";
        if (type === gameProto.LONG){
            res = "LongHuDou/sprite_long";
        }else if (type === gameProto.HU){
            res = "LongHuDou/sprite_hu";
        }else if (type === gameProto.HE){
            res = "LongHuDou/sprite_he";
        }
        return Global.CCHelper.createSpriteNode(res);
    },

    updateWinPercent(longWinCount, huWinCount){
        if (longWinCount === huWinCount){
            this.longWinPercentLabel.string = "50%";
            this.huWinPercentLabel.string = "50%";
            this.longWinPercentLabel.node.parent.width = (this.longWinPercentLabel.node.parent.width + this.huWinPercentLabel.node.parent.width)/2;
            this.huWinPercentLabel.node.parent.width = this.longWinPercentLabel.node.parent.width
        }else{
            let longWinPercent = Math.floor(longWinCount / (longWinCount + huWinCount) * 100);
            this.longWinPercentLabel.string = longWinPercent + "%";
            this.huWinPercentLabel.string = (100 - longWinPercent) + "%";

            this.longWinPercentLabel.node.parent.width = (this.longWinPercentLabel.node.parent.width + this.huWinPercentLabel.node.parent.width) * (longWinPercent/100);
            if (this.longWinPercentLabel.node.parent.width < 60) this.longWinPercentLabel.node.parent.width = 60;
            if (this.longWinPercentLabel.node.parent.width > 780) this.longWinPercentLabel.node.parent.width = 720;
            this.huWinPercentLabel.node.parent.width = 780 - this.longWinPercentLabel.node.parent.width;
        }
    }
});
