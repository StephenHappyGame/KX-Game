let roomProto = require('../../API/RoomProto');
let gameProto = require('./API/HHDZGameProto');
let roomAPI = require('../../API/RoomAPI');
let model = require('./HHDZModel');

cc.Class({
    extends: cc.Component,

    properties: {
        gameCommonCtrl: require("GameCommonController"),

        blackCardsGroup: cc.Node,
        redCardsGroup: cc.Node,

        blackBetRectNode: cc.Node,
        redBetRectNode: cc.Node,
        luckBetRectNode: cc.Node,

        blackBetCountLabel: cc.Label,
        redBetCountLabel: cc.Label,
        luckBetCountLabel: cc.Label,

        winTypeShowNode: cc.Node,

        betRecordItemNode: cc.Node,

        cards: cc.Prefab,

        pointContent: cc.Node,
        cardTypeContent: cc.Node,
        dirPoint: cc.Prefab,
        dirCardType: cc.Prefab,

        selfBetCountBlack: cc.Label,
        selfBetCountRed: cc.Label,
        selfBetCountLuck: cc.Label
    },

    start () {
        this.enableBet = false;
        this.gameResultData = null;
        this.gameInited = false;
        this.dirRecordArr = [];
        this.dirRecordNodeArr = [];
        this.betCountList = {};
        this.betCountList[gameProto.SCORE_BLACK] = 0;
        this.betCountList[gameProto.SCORE_RED] = 0;
        this.betCountList[gameProto.SCORE_LUCK] = 0;
        // 自己下注的金额
        this.selfBetCountList = [];
        this.selfBetCountList[gameProto.SCORE_BLACK] = 0;
        this.selfBetCountList[gameProto.SCORE_RED] = 0;
        this.selfBetCountList[gameProto.SCORE_LUCK] = 0;
        this.points = [];
        this.cardTypeImgs = [];

        this.blackCardsPos = this.blackCardsGroup.position;
        this.redCardsPos = this.redCardsGroup.position;

        //设置牌
        this.blackCards = cc.instantiate(this.cards);
        this.blackCards.parent = this.blackCardsGroup;
        this.redCards = cc.instantiate(this.cards);
        this.redCards.parent = this.redCardsGroup;

        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);

        Global.AudioManager.startPlayBgMusic("LongHuDou/Sound/bg");
    },

    onDestroy(){
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);

        model.onDestroy();

        Global.AudioManager.stopBgMusic();
    },

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if(msg.data.roomUserInfo.userInfo.uid === Global.Player.getPy('uid')){
                    this.exitGame();
                }
            } else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH){
                // 初始化界面场景
                this.gameInit(msg.data.gameData);
            }
        } else if (router === "GameMessagePush") {
            if (!this.gameInited) return;
            if (msg.type === gameProto.GAME_OPERATE_STAKE_PUSH) {
                this.userBet(msg.data, true);
                this.updateBetCount(this.betCountList);
            } else if (msg.type === gameProto.GAME_START_PUSH) {
                cc.log('游戏开始', msg);
                this.onGameStart();
            } else if (msg.type === gameProto.GAME_END_PUSH) {
                cc.log('游戏结束', msg);
                this.onGameEnd(msg.data);
            }
        } else if (router === "ReConnectSuccess"){
            // if(Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(model.roomID, function() {
                    this.onReconnection();
                });
            // } else {
            //     Global.DialogManager.addPopDialog('当前房间已解散！', function () {
            //         Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            //             Global.DialogManager.destroyDialog('TuiTongZi/TTZMainDialog');
            //         });
            //     }, null, true);
            // }
        }
    },

    betEvent(event, param){
        if (!this.enableBet) return;
        let betType = gameProto.SCORE_BLACK;
        if(param === "black"){
            betType = gameProto.SCORE_BLACK;
        }else if (param === "red"){
            betType = gameProto.SCORE_RED;
        }else if (param === "luck"){
            betType = gameProto.SCORE_LUCK;
        }

        let data = {
            type: gameProto.GAME_OPERATE_STAKE_NOTIFY,
            data: {
                betType: betType,
                count: this.gameCommonCtrl.getCurChipNumber()
            }
        };
        roomAPI.gameMessageNotify(data);
    },

    buttonEvent(event, param){
        if (param === "recordNode"){
            //this.onReconnection();
            Global.DialogManager.createDialog("HongHeiDaZhan/HHDZDirRecordDialog", {dirRecordArr: this.dirRecordArr});
        }
    },

    gameInit(gameData){
        this.gameInited = true;
        this.gameCommonCtrl.onGameInit(model.profitPercentage, Global.Enum.gameType.HHDZ);
        // 清楚记录
        this.dirRecordArr = [];
        if(this.dirRecordNodeArr.length > 0){
            for (let i = 0; i < this.dirRecordNodeArr.length; ++i){
                this.dirRecordNodeArr[i].destroy();
            }
        }
        this.dirRecordNodeArr = [];
        this.addDirRecord(gameData.dirRecord);

        if(gameData.gameStatus === gameProto.gameStatus.NONE) return;

        if(gameData.gameStatus === gameProto.gameStatus.GAME_STARTED){
            this.onGameStart();
        }else if(gameData.gameStatus === gameProto.gameStatus.GAME_END){
            if(!!gameData.resultData){
                this.gameResultData = gameData.resultData;
                this.onShowCard(false);
                this.onShowResult();
            }
            // 显示等待
            this.gameCommonCtrl.showWait(true);
        }

        // 设置筹码
        if (!!gameData.betRecordList){
            for (let key in gameData.betRecordList){
                if (gameData.betRecordList.hasOwnProperty(key)){
                    let userBetInfo = gameData.betRecordList[key];
                    if (!!userBetInfo[gameProto.SCORE_BLACK]) this.userBet({uid: key, betType: gameProto.SCORE_BLACK, count: userBetInfo[gameProto.SCORE_BLACK]}, false);
                    if (!!userBetInfo[gameProto.SCORE_RED]) this.userBet({uid: key, betType: gameProto.SCORE_RED, count: userBetInfo[gameProto.SCORE_RED]}, false);
                    if (!!userBetInfo[gameProto.SCORE_LUCK]) this.userBet({uid: key, betType: gameProto.SCORE_LUCK, count: userBetInfo[gameProto.SCORE_LUCK]}, false);
                }
            }
        }
        this.updateBetCount(this.betCountList);
    },

    onReconnection(){
        // 清理数据
        this.enableBet = false;
        this.gameResultData = null;
        this.gameInited = false;
        // 停止动作
        this.node.stopAllActions();
        // 更新下注信息
        this.betCountList = {};
        this.betCountList[gameProto.SCORE_BLACK] = 0;
        this.betCountList[gameProto.SCORE_RED] = 0;
        this.betCountList[gameProto.SCORE_LUCK] = 0;
        // 自己下注的金额
        this.selfBetCountList = [];
        this.selfBetCountList[gameProto.SCORE_BLACK] = 0;
        this.selfBetCountList[gameProto.SCORE_RED] = 0;
        this.selfBetCountList[gameProto.SCORE_LUCK] = 0;
        this.updateBetCount(this.betCountList);
        // 清理扑克牌
        this.blackCardsGroup.stopAllActions();
        this.blackCardsGroup.active = false;
        this.redCardsGroup.stopAllActions();
        this.redCardsGroup.active = false;
        // 清理走势
        this.dirRecordArr = [];
        for(let i = 0; i < this.dirRecordNodeArr.length; ++i){
            this.dirRecordNodeArr[i].destroy();
        }
        this.dirRecordNodeArr = [];
        // 游戏公共控制重连
        this.gameCommonCtrl.onReconnection();
        // 请求场景数据
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onGameStart(){
        // 清理下注金额
        this.betCountList = {};
        this.betCountList[gameProto.SCORE_BLACK] = 0;
        this.betCountList[gameProto.SCORE_RED] = 0;
        this.betCountList[gameProto.SCORE_LUCK] = 0;

        // 自己下注的金额
        this.selfBetCountList = [];
        this.selfBetCountList[gameProto.SCORE_BLACK] = 0;
        this.selfBetCountList[gameProto.SCORE_RED] = 0;
        this.selfBetCountList[gameProto.SCORE_LUCK] = 0;

        this.updateBetCount(this.betCountList);
        this.node.stopAllActions();
        // 执行游戏开始
        this.gameCommonCtrl.onGameStart();
        // 开启动作
        this.node.runAction(cc.sequence([cc.delayTime(1), cc.callFunc(this.onBetStart.bind(this)), cc.delayTime(gameProto.stakeTime), cc.callFunc(this.onBetStop.bind(this))]));
    },

    onBetStart(){
        cc.log('开始下注');
        this.enableBet = true;
        this.gameCommonCtrl.onGameBetStart();
        this.onDispatchCard();
    },

    onBetStop(){
        cc.log('停止下注');
        this.enableBet = false;
        this.gameCommonCtrl.onGameBetEnd();
        this.node.stopAllActions();
    },

    onGameEnd(data){
        this.gameResultData = data;
        if (this.enableBet) this.onBetStop();
        this.node.stopAllActions();
        let actions = [cc.delayTime(this.enableBet?2:0.1), cc.callFunc(this.onShowCard.bind(this)), cc.delayTime(4), cc.callFunc(this.onShowWin.bind(this)), cc.delayTime(3), cc.callFunc(this.onShowResult.bind(this))];
        this.node.runAction(cc.sequence(actions));
    },

    onShowCard(isAnim){
        if (!this.gameResultData) return;
        this.blackCardsGroup.active = true;
        this.redCardsGroup.active = true;
        cc.log(this.gameResultData);

        this.blackCards.getComponent('HHDZCards').showCards(this.gameResultData.cardsData[gameProto.BLACK]);
        this.scheduleOnce(function () {
            this.redCards.getComponent('HHDZCards').showCards(this.gameResultData.cardsData[gameProto.RED]);
        }.bind(this), 2);
    },

    onDispatchCard(){
        this.blackCardsGroup.active = true;
        this.redCardsGroup.active = true;

        this.blackCards.getComponent('HHDZCards').hideCards();
        this.redCards.getComponent('HHDZCards').hideCards();

        this.blackCardsGroup.position = cc.v2(0, 25);
        let action1 = cc.moveTo(0.2, this.blackCardsPos);
        action1.easing(cc.easeIn(3.0));
        this.blackCardsGroup.runAction(action1);
        this.redCardsGroup.position = cc.v2(0, 25);
        let action2 = cc.moveTo(0.2, this.redCardsPos);
        action2.easing(cc.easeIn(3.0));
        this.redCardsGroup.runAction(action2);

        Global.AudioManager.playSound("GameCommon/Sound/sendcard");
    },

    onShowWin(){
        if (!this.gameResultData) return;
        let winType = this.gameResultData.winType;
        let nodeName = "";
        let soundUrl = "LongHuDou/Sound/";
        if (winType === gameProto.BLACK){
            nodeName = "Black";
            soundUrl += "long_win";
        }else if (winType === gameProto.RED){
            nodeName = "Red";
            soundUrl += "hu_win";
        }

        // Global.AudioManager.playSound(soundUrl);
        let node = this.winTypeShowNode.getChildByName(nodeName);
        if (!!node){
            node.active = true;
            let action = cc.sequence([cc.fadeIn(0.3), cc.delayTime(0.2), cc.fadeOut(0.6)]);
            node.opacity = 0;
            node.runAction(cc.repeat(action, 3));
        }

        if (this.gameResultData.luck) {
            let node = this.winTypeShowNode.getChildByName('Luck');
            if (!!node){
                node.active = true;
                let action = cc.sequence([cc.fadeIn(0.3), cc.delayTime(0.2), cc.fadeOut(0.6)]);
                node.opacity = 0;
                node.runAction(cc.repeat(action, 3));
            }
        }
    },

    onShowResult(){
        this.gameCommonCtrl.onGameResult(this.gameResultData.scoreChangeArr);
        this.addDirRecord([{winner: this.gameResultData.winType, winnerCardType: this.gameResultData.winnerCardType}]);
    },

    userBet(data, isTween){
        this.betCountList[data.betType] += data.count;
        if (data.uid === Global.Player.getPy('uid')) {
            this.selfBetCountList[data.betType] += data.count;
        }
        let betRect = cc.rect(0,0,0,0);
        if (data.betType === gameProto.SCORE_BLACK){
            betRect = this.blackBetRectNode.getBoundingBox();
        }else if (data.betType === gameProto.SCORE_RED){
            betRect = this.redBetRectNode.getBoundingBox();
        }else if (data.betType === gameProto.SCORE_LUCK){
            betRect = this.luckBetRectNode.getBoundingBox();
        }
        this.gameCommonCtrl.userBet(data.uid, data.count, betRect, isTween);
    },

    updateBetCount(betCountList){
        this.blackBetCountLabel.string = betCountList[gameProto.SCORE_BLACK].toString();
        this.redBetCountLabel.string = betCountList[gameProto.SCORE_RED].toString();
        this.luckBetCountLabel.string = betCountList[gameProto.SCORE_LUCK].toString();

        this.selfBetCountBlack.string = '下注:' + this.selfBetCountList[gameProto.SCORE_BLACK].toString();
        this.selfBetCountRed.string = '下注:' + this.selfBetCountList[gameProto.SCORE_RED].toString();
        this.selfBetCountLuck.string = '下注:' + this.selfBetCountList[gameProto.SCORE_LUCK].toString();
    },

    addDirRecord(dirRecordList){
        Global.MessageCallback.emitMessage('UpdateDirRecord', dirRecordList);

        this.dirRecordArr = this.dirRecordArr.concat(dirRecordList);
        while (this.dirRecordArr.length > gameProto.DIR_COUNT) {
            this.dirRecordArr.shift();
        }

        for (let i = 0; i < dirRecordList.length; i ++) {
            if (this.points.length === 18) {
                this.points[0].destroy();
                this.points.shift();
            }

            if (this.cardTypeImgs.length === 7) {
                this.cardTypeImgs[0].destroy();
                this.cardTypeImgs.shift();
            }

            let point = cc.instantiate(this.dirPoint);
            point.parent = this.pointContent;
            point.getChildByName('redPoint').active = dirRecordList[i].winner === gameProto.RED;
            this.points[this.points.length] = point;

            let cardTypeImg = cc.instantiate(this.dirCardType);
            cardTypeImg.parent = this.cardTypeContent;
            Global.CCHelper.updateSpriteFrame('HongHeiDaZhan/dir_cardType_' + dirRecordList[i].winnerCardType, cardTypeImg.getComponent(cc.Sprite));
            this.cardTypeImgs[this.cardTypeImgs.length] = cardTypeImg;
        }
    },

    exitGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this, true);
            Global.CCHelper.releaseRes(['HongHeiDaZhan']);
        }.bind(this));
    }
});
