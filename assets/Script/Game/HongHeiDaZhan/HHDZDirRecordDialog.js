let gameProto = require('./API/HHDZGameProto');

cc.Class({
    extends: cc.Component,

    properties: {
        trendItemController: require("../LongHuDou/LHDTrendItem"),

        blackWinPercentLabel: cc.Label,
        redWinPercentLabel: cc.Label,

        dirPoint: cc.Prefab,
        pointContent: cc.Node,
        dirCardTypeImg: cc.Prefab,
        cardTypeImgContent: cc.Node,

        redCount: cc.Label,
        blackCount: cc.Label,
        totalCount: cc.Label
    },

    start () {
        this.points = [];
        this.cardTypeImgs = [];
        this.dirRecordArr = this.dialogParameters.dirRecordArr;

        this.updateTrendItemController();
        this.addDirRecord(this.dirRecordArr);
        this.updateWinPercent();

        Global.MessageCallback.addListener('UpdateDirRecord', this);
    },

    onDestroy () {
        Global.MessageCallback.removeListener('UpdateDirRecord', this);
    },

    messageCallbackHandler(router, msg) {
        if (router === 'UpdateDirRecord') {
            this.dirRecordArr = this.dirRecordArr.concat(msg);
            this.addDirRecord(msg);
            this.updateWinPercent();
            this.updateTrendItemController();
        }
    },

    buttonEvent(event, param){
        if (param === "close"){
            Global.DialogManager.destroyDialog(this, true);
        }
    },

    updateTrendItemController () {
        let arr = [];
        let startIndex = 0;
        let redWinCount = 0;
        let blackWinCount = 0;
        if (this.dirRecordArr.length > gameProto.DIR_COUNT) {
            startIndex = this.dirRecordArr.length - gameProto.DIR_COUNT;
        }

        for (let i = startIndex; i < this.dirRecordArr.length; i ++) {
            arr.push(this.dirRecordArr[i].winner);

            if (this.dirRecordArr[i].winner === gameProto.BLACK) {
                blackWinCount ++;
            } else if (this.dirRecordArr[i].winner === gameProto.RED) {
                redWinCount ++;
            }
        }

        this.redCount.string = '红 ' + redWinCount;
        this.blackCount.string = '黑 ' + blackWinCount;
        this.totalCount.string = '局数 ' + (redWinCount + blackWinCount);
        this.trendItemController.init(arr, Global.Enum.gameType.HHDZ);
    },

    addDirRecord(dirRecordList){
        for (let i = 0; i < dirRecordList.length; i ++) {
            if (this.points.length === 20) {
                this.points[0].destroy();
                this.points.shift();
            }

            if (this.cardTypeImgs.length === 20) {
                this.cardTypeImgs[0].destroy();
                this.cardTypeImgs.shift();
            }

            let point = cc.instantiate(this.dirPoint);
            point.parent = this.pointContent;
            point.getChildByName('redPoint').active = dirRecordList[i].winner === gameProto.RED;
            this.points[this.points.length] = point;

            let cardTypeImg = cc.instantiate(this.dirCardTypeImg);
            cardTypeImg.parent = this.cardTypeImgContent;
            Global.CCHelper.updateSpriteFrame('HongHeiDaZhan/dir_cardType_' + dirRecordList[i].winnerCardType, cardTypeImg.getComponent(cc.Sprite));
            this.cardTypeImgs[this.cardTypeImgs.length] = cardTypeImg;
        }
    },

    updateWinPercent () {
        let blackWinCount = 0;
        let redWinCount = 0;

        let startIndex = 0;
        if (this.dirRecordArr.length >= 20) {
            startIndex = this.dirRecordArr.length - 20;
        }

        for (let i = startIndex; i < this.dirRecordArr.length; i ++){
            if (this.dirRecordArr[i].winner === gameProto.BLACK)
                blackWinCount++;
            else if (this.dirRecordArr[i].winner === gameProto.RED)
                redWinCount++;
        }

        if (blackWinCount === redWinCount){
            this.blackWinPercentLabel.string = "50%";
            this.redWinPercentLabel.string = "50%";
            this.blackWinPercentLabel.node.parent.width = (this.blackWinPercentLabel.node.parent.width + this.redWinPercentLabel.node.parent.width) / 2;
            this.redWinPercentLabel.node.parent.width = this.blackWinPercentLabel.node.parent.width;
        }else{
            let blackWinPercent = Math.floor(blackWinCount / (blackWinCount + redWinCount) * 100);
            this.blackWinPercentLabel.string = blackWinPercent + "%";
            this.redWinPercentLabel.string = (100 - blackWinPercent) + "%";

            this.blackWinPercentLabel.node.parent.width = (this.blackWinPercentLabel.node.parent.width + this.redWinPercentLabel.node.parent.width) * (blackWinPercent / 100);
            if (this.blackWinPercentLabel.node.parent.width < 60) this.blackWinPercentLabel.node.parent.width = 60;
            if (this.blackWinPercentLabel.node.parent.width > 540) this.blackWinPercentLabel.node.parent.width = 540;
            this.redWinPercentLabel.node.parent.width = 600 - this.blackWinPercentLabel.node.parent.width;
        }
    }
});
