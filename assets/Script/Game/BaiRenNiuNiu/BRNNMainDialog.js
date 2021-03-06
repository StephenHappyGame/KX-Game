let roomProto = require('../../API/RoomProto');
let gameProto = require('./BRNNProto');
let roomAPI = require('../../API/RoomAPI');


cc.Class({
    extends: cc.Component,

    properties: {
        gameCommonCtrl: require("BRNNGameCommonCtrl"),
        cardWidgetPrefab: cc.Prefab,
        cardWidgetPosNode: [cc.Node],
        betRectNodeArr: [cc.Node],
        betCountLabelArr: [cc.Label],
        selfBetCountLabelArr: [cc.Label],
        winTypeShowNodeArr: [cc.Node],
        clockWidgetCtrl: require("BRNNClockWidgetCtrl"),
        recordWidgetCtrl: require("BRNNRecordWidgetCtrl"),
        drawIDLabel: cc.Label,

        bankerPosNode: cc.Node,

        otherUserWinLabel: cc.Label,
        otherUserLoseLabel: cc.Label
    },

    start () {
        this.enableBet = false;

        this.gameInited = false;

        this.roomID = "";
        this.profitPercentage = 0;

        this.cardWidgetCtrlArr = [];
        for (let i = 0; i < 5; ++i){
            let node = cc.instantiate(this.cardWidgetPrefab);
            let ctrl = node.getComponent("BRNNCardWidgetCtrl");
            node.parent = this.cardWidgetPosNode[i];
            this.cardWidgetCtrlArr.push(ctrl);
            node.active = false;
        }

        this.betCountList = {};
        this.lastDrawBetCountList = null;
        this.betCountList[gameProto.TIAN] = 0;
        this.betCountList[gameProto.DI] = 0;
        this.betCountList[gameProto.XUAN] = 0;
        this.betCountList[gameProto.HUANG] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.TIAN] = 0;
        this.selfBetCountList[gameProto.DI] = 0;
        this.selfBetCountList[gameProto.XUAN] = 0;
        this.selfBetCountList[gameProto.HUANG] = 0;

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
    },

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if(msg.data.roomUserInfo.userInfo.uid === Global.Player.getPy("uid")){
                    this.exitGame();
                }
            } else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH){
                // ?????????????????????
                this.gameInit(msg.data.gameData);
            }
        } else if (router === "GameMessagePush") {
            if (!this.gameInited) return;
            if (msg.type === gameProto.GAME_POURGOLD_PUSH) {
                this.userBet(msg.data, true);
                this.updateBetCount(this.betCountList, this.selfBetCountList);
            } else if (msg.type === gameProto.GAME_START_PUSH) {
                this.onGameStart(gameProto.BET_TIME, msg.data.drawID);
            } else if (msg.type === gameProto.GAME_RESULT_PUSH) {
                this.onGameEnd(msg.data);
            }
        } else if (router === "ReConnectSuccess"){
            if(Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(Global.Player.roomID, function() {
                    this.onReconnection();
                });
            } else {
                this.exitGame();
            }
        }
    },

    betEvent(event, param){
        if (!this.enableBet) {
            Global.DialogManager.addTipDialog("??????????????????????????????");
            return;
        }
        if (param === "continueBet"){
            if (!this.lastDrawBetCountList){
                Global.DialogManager.addTipDialog("???????????????????????????????????????");
                return;
            }
            let totalBetCount = 0;
            let betArr = [];
            for (let key in this.lastDrawBetCountList){
                if (this.lastDrawBetCountList.hasOwnProperty(key)){
                    if (!this.lastDrawBetCountList[key]) continue;
                    betArr.push({betType: parseInt(key), betCount: this.lastDrawBetCountList[key]});
                    totalBetCount += this.betCountList[key];
                }
            }
            let selfCtrl = this.gameCommonCtrl.getGameHeadCtrlByUid(Global.Player.getPy("uid"))[0];
            if (selfCtrl.getUserInfo.gold < totalBetCount * 3){
                Global.DialogManager.addPopDialog("???????????????????????????????????????1/3");
                return;
            }
            roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(betArr));
        }else {
            let totalBetCount = this.selfBetCountList[gameProto.TIAN] + this.selfBetCountList[gameProto.DI] + this.selfBetCountList[gameProto.XUAN] + this.selfBetCountList[gameProto.HUANG];
            let betCount = this.gameCommonCtrl.getCurChipNumber();
            if (totalBetCount + betCount > Global.Player.gold/3){
                Global.DialogManager.addPopDialog("???????????????????????????????????????1/3");
                return;
            }
            if(param === "tian"){
                roomAPI.gameMessageNotify(gameProto.gameUserBetNotify([{betType: gameProto.TIAN, betCount: this.gameCommonCtrl.getCurChipNumber()}]));
            }else if (param === "di"){
                roomAPI.gameMessageNotify(gameProto.gameUserBetNotify([{betType: gameProto.DI, betCount: this.gameCommonCtrl.getCurChipNumber()}]));
            }else if (param === "xuan"){
                roomAPI.gameMessageNotify(gameProto.gameUserBetNotify([{betType: gameProto.XUAN, betCount: this.gameCommonCtrl.getCurChipNumber()}]));
            }else if (param === "huang"){
                roomAPI.gameMessageNotify(gameProto.gameUserBetNotify([{betType: gameProto.HUANG, betCount: this.gameCommonCtrl.getCurChipNumber()}]));
            }
        }
    },

    gameInit(gameData){
        this.gameInited = true;
        this.profitPercentage = gameData.profitPercentage;
        this.gameCommonCtrl.onGameInit(parseInt(gameData.profitPercentage), Global.Enum.gameType.BRNN);
        // ????????????
        this.recordWidgetCtrl.addDirRecord(gameData.dirRecord);
        this.drawIDLabel.node.active = true;
        this.drawIDLabel.string = "????????????:" + gameData.drawID;
        if(gameData.gameStatus === gameProto.gameStatus.NONE || gameData.gameStatus === gameProto.gameStatus.GAME_END){
            // ??????????????????????????????
            this.gameCommonCtrl.showWait(true);
            return;
        }

        if(gameData.gameStatus === gameProto.gameStatus.GAME_STARTED) this.onGameStart(gameData.betLeftTime, gameData.drawID);

        // ????????????
        if (!!gameData.betRecordList){
            for (let key in gameData.betRecordList){
                if (gameData.betRecordList.hasOwnProperty(key)){
                    let userBetInfo = gameData.betRecordList[key];
                    if (gameProto.TIAN in userBetInfo) this.userBet({uid: key, betInfoArr:[{betType: gameProto.TIAN, betCount: userBetInfo[gameProto.TIAN]}]}, false);
                    if (gameProto.DI in userBetInfo) this.userBet({uid: key, betInfoArr:[{betType: gameProto.DI, betCount: userBetInfo[gameProto.DI]}]}, false);
                    if (gameProto.XUAN in userBetInfo) this.userBet({uid: key, betInfoArr:[{betType: gameProto.XUAN, betCount: userBetInfo[gameProto.XUAN]}]}, false);
                    if (gameProto.HUANG in userBetInfo) this.userBet({uid: key, betInfoArr:[{betType: gameProto.HUANG, betCount: userBetInfo[gameProto.HUANG]}]}, false);
                }
            }
        }
        this.updateBetCount(this.betCountList, this.selfBetCountList);
    },

    resetGame: function () {
        // ????????????
        this.enableBet = false;
        this.gameInited = false;
        // ????????????
        this.node.stopAllActions();
        // ??????????????????
        this.betCountList = {};
        this.betCountList[gameProto.TIAN] = 0;
        this.betCountList[gameProto.DI] = 0;
        this.betCountList[gameProto.XUAN] = 0;
        this.betCountList[gameProto.HUANG] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.TIAN] = 0;
        this.selfBetCountList[gameProto.DI] = 0;
        this.selfBetCountList[gameProto.XUAN] = 0;
        this.selfBetCountList[gameProto.HUANG] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);
        // ???????????????
        for (let i = 0; i < this.cardWidgetCtrlArr.length; ++i){
            this.cardWidgetCtrlArr[i].resetWidget();
        }
        // ????????????
        this.recordWidgetCtrl.resetWidget();
        // ???????????????
        this.clockWidgetCtrl.resetWidget();
    },

    onReconnection(){
        this.resetGame();
        // ????????????????????????
        this.gameCommonCtrl.onReconnection();
        // ??????????????????
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onGameStart(betLeftTime, drawID){
        this.drawIDLabel.string = "????????????:" + drawID;
        // ??????????????????
        this.betCountList = {};
        this.betCountList[gameProto.TIAN] = 0;
        this.betCountList[gameProto.DI] = 0;
        this.betCountList[gameProto.XUAN] = 0;
        this.betCountList[gameProto.HUANG] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.TIAN] = 0;
        this.selfBetCountList[gameProto.DI] = 0;
        this.selfBetCountList[gameProto.XUAN] = 0;
        this.selfBetCountList[gameProto.HUANG] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);
        this.node.stopAllActions();
        if (betLeftTime <= 2) {
            for (let i = 0; i < this.cardWidgetCtrlArr.length; ++i){
                this.cardWidgetCtrlArr[i].sendCard(i, false);
            }
            // ?????????????????????
            this.clockWidgetCtrl.startClock(betLeftTime, "?????????...");
            return;
        }
        // ??????????????????
        this.gameCommonCtrl.onGameStart();
        // ????????????
        this.node.runAction(cc.sequence([cc.callFunc(
            function () {
                this.onBetStart(betLeftTime === gameProto.BET_TIME);
            }.bind(this)
        ), cc.delayTime(betLeftTime), cc.callFunc(this.onBetStop.bind(this))]));
        // ?????????????????????
        this.clockWidgetCtrl.startClock(betLeftTime, "?????????...");
    },

    onBetStart(isTween){
        this.enableBet = true;
        this.gameCommonCtrl.onGameBetStart();

        for (let i = 0; i < this.cardWidgetCtrlArr.length; ++i){
            this.cardWidgetCtrlArr[i].sendCard(i, isTween);
        }
    },

    onBetStop(){
        this.enableBet = false;
        this.gameCommonCtrl.onGameBetEnd();
        this.node.stopAllActions();

        this.lastDrawBetCountList = this.selfBetCountList;
    },

    onGameEnd(data){
        if (this.enableBet) this.onBetStop();
        this.node.stopAllActions();
        let actions = [cc.delayTime(this.enableBet?2:0.1), cc.callFunc(
            function () {
                this.onShowCard(data.allCardDataArr, data.cardTypeArr);
            }.bind(this)),
            cc.delayTime(gameProto.SHOW_CARD_TIME),
            cc.callFunc(function () {
                this.onShowWin(data.winTimesArr);
            }.bind(this)),
            cc.delayTime(2),
            cc.callFunc(function () {
                this.onShowResult(data.scoreChangeArr, data.winTimesArr);
            }.bind(this)),
            cc.delayTime(gameProto.PAI_JIANG_TIME - 2),
            cc.callFunc(this.onClear.bind(this))
        ];
        this.node.runAction(cc.sequence(actions));
    },

    onShowCard(allCardDataArr, cardTypeArr){
        // ???????????????
        this.clockWidgetCtrl.startClock(gameProto.SHOW_CARD_TIME, "?????????...");

        for (let i = 0; i < allCardDataArr.length; ++i){
            this.cardWidgetCtrlArr[i].showCard(allCardDataArr[i], cardTypeArr[i], i);
        }
    },

    onShowWin(winTimesArr){
        this.clockWidgetCtrl.startClock(gameProto.PAI_JIANG_TIME, "?????????...");
        for (let i =0; i < winTimesArr.length; ++i){
            if (winTimesArr[i] > 0){
                let node = this.winTypeShowNodeArr[i];
                node.active = true;
                let action = cc.sequence([cc.show(), cc.fadeTo(0.3, 255),cc.fadeTo(0.3, 0)]);
                node.opacity = 0;
                node.runAction(cc.repeat(action, 3));
            }
        }
    },

    onShowResult(scoreChangeArr, winTimesArr){
        let actions = [];
        let isBankerGain = false;
        for (let i = 0; i < winTimesArr.length; ++i){
            if (winTimesArr[i] < 0){
                isBankerGain = true;
                break;
            }
        }
        if (isBankerGain){
            actions.push(cc.callFunc(function () {
                for (let i = 0; i < winTimesArr.length; ++i){
                    if (winTimesArr[i] < 0){
                        this.gameCommonCtrl.execBankerGainGold(this.bankerPosNode.position, this.betRectNodeArr[i].getBoundingBox() || cc.rect(0,0,0,0));
                    }
                }
            }.bind(this)));
            actions.push(cc.delayTime(0.6));
        }
        let isBankerSend = false;
        for (let i = 0; i < winTimesArr.length; ++i){
            if (winTimesArr[i] > 0){
                isBankerSend = true;
                break;
            }
        }
        if (isBankerSend){
            actions.push(cc.callFunc(function () {
                for (let i = 0; i < winTimesArr.length; ++i){
                    if (winTimesArr[i] > 0){
                        this.gameCommonCtrl.execBankerSendGold(this.bankerPosNode.position, this.betRectNodeArr[i].getBoundingBox() || cc.rect(0,0,0,0), this.betCountList[i] * winTimesArr[i]);
                    }
                }
            }.bind(this)));
            actions.push(cc.delayTime(0.6));
        }
        let otherUserWinCount = 0;
        for (let i = 0; i < winTimesArr.length; ++i){
            if (winTimesArr[i] > 0){
                otherUserWinCount += (winTimesArr[i] * (this.betCountList[i] - this.selfBetCountList[i]) * (1 - this.profitPercentage/100));
            }else{
                otherUserWinCount += (winTimesArr[i] * (this.betCountList[i] - this.selfBetCountList[i]));
            }
        }
        if (actions.length > 0){
            actions.push(cc.callFunc(function () {
                this.gameCommonCtrl.onGameResult(scoreChangeArr);
                // ???????????????????????????
                if (otherUserWinCount > 0){
                    this.otherUserWinLabel.node.active = true;
                    this.otherUserWinLabel.string = "+" + Global.Utils.formatNumberToString(otherUserWinCount, 2) + "???";
                    this.otherUserWinLabel.node.position = cc.v2(0, -50);
                    this.otherUserWinLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 0)), cc.delayTime(2), cc.hide()]));
                }else if (otherUserWinCount < 0){
                    this.otherUserLoseLabel.node.active = true;
                    this.otherUserLoseLabel.string = Global.Utils.formatNumberToString(otherUserWinCount, 2) + "???";
                    this.otherUserLoseLabel.node.position = cc.v2(0, -50);
                    this.otherUserLoseLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 0)), cc.delayTime(2), cc.hide()]));
                }
            }.bind(this)));
            this.node.runAction(cc.sequence(actions));
        }else{
            this.gameCommonCtrl.onGameResult(scoreChangeArr);
            // ??????????????????????????????
            if (otherUserWinCount > 0){
                this.otherUserWinLabel.node.active = true;
                this.otherUserWinLabel.string = "+" + Global.Utils.formatNumberToString(otherUserWinCount, 2) + "???";
                this.otherUserWinLabel.node.position = cc.v2(0, -50);
                this.otherUserWinLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 0)), cc.delayTime(2), cc.hide()]));
            }else if (otherUserWinCount < 0){
                this.otherUserLoseLabel.node.active = true;
                this.otherUserLoseLabel.string = Global.Utils.formatNumberToString(otherUserWinCount, 2) + "???";
                this.otherUserLoseLabel.node.position = cc.v2(0, -50);
                this.otherUserLoseLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 0)), cc.delayTime(2), cc.hide()]));
            }
        }
        this.recordWidgetCtrl.addDirRecord([winTimesArr]);
    },

    onClear: function () {
        this.clockWidgetCtrl.startClock(gameProto.XIU_XI_TIME, "????????????");

        // ??????????????????
        for (let i = 0; i < this.cardWidgetCtrlArr.length; ++i){
            this.cardWidgetCtrlArr[i].resetWidget();
        }

        // ??????????????????
        this.betCountList = {};
        this.betCountList[gameProto.TIAN] = 0;
        this.betCountList[gameProto.DI] = 0;
        this.betCountList[gameProto.XUAN] = 0;
        this.betCountList[gameProto.HUANG] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.TIAN] = 0;
        this.selfBetCountList[gameProto.DI] = 0;
        this.selfBetCountList[gameProto.XUAN] = 0;
        this.selfBetCountList[gameProto.HUANG] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);

        this.node.stopAllActions();
    },

    userBet(data, isTween){
        for (let i = 0; i < data.betInfoArr.length; ++i){
            let info = data.betInfoArr[i];
            this.betCountList[info.betType] += info.betCount;
            if (data.uid === Global.Player.getPy("uid")){
                this.selfBetCountList[info.betType] += info.betCount;
            }
            let betRect = this.betRectNodeArr[info.betType].getBoundingBox() || cc.rect(0,0,0,0);
            this.gameCommonCtrl.userBet(data.uid, info.betCount, betRect, isTween);
        }

    },

    updateBetCount(betCountList, selfBetCountList){
        for (let key in betCountList){
            if (betCountList.hasOwnProperty(key)){
                this.betCountLabelArr[key].string = betCountList[key].toString();
            }
        }
        for (let key in selfBetCountList){
            if (selfBetCountList.hasOwnProperty(key)){
                this.selfBetCountLabelArr[key].node.active = selfBetCountList[key] !== 0;
                this.selfBetCountLabelArr[key].string = selfBetCountList[key].toString();
            }
        }
    },

    exitGame(){
        Global.Player.setPy('roomID', null);
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this, true);
            Global.CCHelper.releaseRes(['Game/BaiRenNiuNiu']);
        }.bind(this));
    }
});
