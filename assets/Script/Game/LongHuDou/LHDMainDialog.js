let roomProto = require('../../API/RoomProto');
let gameProto = require('./LHDProto');
let roomAPI = require('../../API/RoomAPI');
let model = require('./LHDModel');


cc.Class({
    extends: cc.Component,

    properties: {
        gameCommonCtrl: require("GameCommonController"),
        longCardSprite: cc.Sprite,
        huCardSprite: cc.Sprite,
        longBetRectNode: cc.Node,
        huBetRectNode: cc.Node,
        heBetRectNode: cc.Node,
        longBetCountLabel: cc.Label,
        huBetCountLabel: cc.Label,
        heBetCountLabel: cc.Label,
        selfLongBetCountLabel: cc.Label,
        selfHuBetCountLabel: cc.Label,
        selfHeBetCountLabel: cc.Label,
        winTypeShowNode: cc.Node,
        betRecordItemNode: cc.Node
    },

    start () {
        this.enableBet = false;
        this.gameResultData = null;
        this.gameInited = false;
        this.dirRecordArr = [];
        this.dirRecordNodeArr = [];
        this.betCountList = {};
        this.betCountList[gameProto.LONG] = 0;
        this.betCountList[gameProto.HU] = 0;
        this.betCountList[gameProto.HE] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.LONG] = 0;
        this.selfBetCountList[gameProto.HU] = 0;
        this.selfBetCountList[gameProto.HE] = 0;

        this.longCardPos = this.longCardSprite.node.position;
        this.huCardPos = this.huCardSprite.node.position;

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
    },

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if(msg.data.roomUserInfo.userInfo.uid === model.selfUid){
                    this.exitGame();
                }
            } else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH){
                // 初始化界面场景
                this.gameInit(msg.data.gameData);
            }
        } else if (router === "GameMessagePush") {
            if (!this.gameInited) return;
            if (msg.type === gameProto.GAME_POURGOLD_PUSH) {
                this.userBet(msg.data, true);
                this.updateBetCount(this.betCountList, this.selfBetCountList);
            } else if (msg.type === gameProto.GAME_START_PUSH) {
                this.onGameStart(gameProto.BET_TIME);
            } else if (msg.type === gameProto.GAME_RESULT_PUSH) {
                this.onGameEnd(msg.data);
            }
        } else if (router === "ReConnectSuccess"){
            Global.API.hall.joinRoomRequest(model.roomID, function() {
                this.onReconnection();
            }.bind(this));
        }
    },

    betEvent(event, param){
        if (!this.enableBet) return;
        if(param === "long"){
            roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(gameProto.LONG, this.gameCommonCtrl.getCurChipNumber()));
        }else if (param === "hu"){
            roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(gameProto.HU, this.gameCommonCtrl.getCurChipNumber()));
        }else if (param === "he"){
            roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(gameProto.HE, this.gameCommonCtrl.getCurChipNumber()));
        }
    },

    buttonEvent(event, param){
        if (param === "recordNode"){
            Global.DialogManager.createDialog("LongHuDou/Trend/LHDTrendDialog", {dirRecordArr: this.dirRecordArr});
        }
    },

    gameInit(gameData){
        this.gameInited = true;
        this.gameCommonCtrl.onGameInit(model.profitPercentage, model.kindId);
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

        // 设置筹码
        if (!!gameData.betRecordList){
            for (let key in gameData.betRecordList){
                if (gameData.betRecordList.hasOwnProperty(key)){
                    let userBetInfo = gameData.betRecordList[key];
                    if (gameProto.LONG in userBetInfo) this.userBet({uid: key, betType: gameProto.LONG, count: userBetInfo[gameProto.LONG]}, false);
                    if (gameProto.HU in userBetInfo) this.userBet({uid: key, betType: gameProto.HU, count: userBetInfo[gameProto.HU]}, false);
                    if (gameProto.HE in userBetInfo) this.userBet({uid: key, betType: gameProto.HE, count: userBetInfo[gameProto.HE]}, false);
                }
            }
        }
        this.updateBetCount(this.betCountList, this.selfBetCountList);

        if(gameData.gameStatus === gameProto.gameStatus.GAME_STARTED){
            this.onGameStart(gameData.betLeftTime);
        }else if(gameData.gameStatus === gameProto.gameStatus.GAME_END){
            if(!!gameData.resultData){
                this.gameResultData = gameData.resultData;
                this.onShowCard(false);
                this.onShowResult();
            }
            // 显示等待
            this.gameCommonCtrl.showWait(true);
        }
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
        this.betCountList[gameProto.LONG] = 0;
        this.betCountList[gameProto.HU] = 0;
        this.betCountList[gameProto.HE] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.LONG] = 0;
        this.selfBetCountList[gameProto.HU] = 0;
        this.selfBetCountList[gameProto.HE] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);
        // 清理扑克牌
        this.longCardSprite.node.stopAllActions();
        this.longCardSprite.node.active = false;
        this.huCardSprite.node.stopAllActions();
        this.huCardSprite.node.active = false;
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

    onGameStart(betLeftTime){
        // 清理下注金额
        this.betCountList = {};
        this.betCountList[gameProto.LONG] = 0;
        this.betCountList[gameProto.HU] = 0;
        this.betCountList[gameProto.HE] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.LONG] = 0;
        this.selfBetCountList[gameProto.HU] = 0;
        this.selfBetCountList[gameProto.HE] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);
        this.node.stopAllActions();
        //if (betLeftTime <= 2) return;
        // 执行游戏开始
        this.gameCommonCtrl.onGameStart();
        // 开启动作
        this.node.runAction(cc.sequence([cc.callFunc(this.onBetStart.bind(this)), cc.delayTime(gameProto.BET_TIME), cc.callFunc(this.onBetStop.bind(this))]));
        // 开启下注倒计时
        /*
        this.timeLabel.node.stopAllActions();
        this.timeLabel.node.parent.active = true;
        let leftTime = betLeftTime;
        this.timeLabel.node.runAction(cc.repeat(cc.sequence([cc.callFunc(function () {
            this.timeLabel.string = leftTime.toString();
            leftTime--;
        }.bind(this)), cc.delayTime(1)]), leftTime));
        */
    },

    onBetStart(){
        this.enableBet = true;
        this.gameCommonCtrl.onGameBetStart();
        this.onDispatchCard();
    },

    onBetStop(){
        /*this.timeLabel.node.stopAllActions();
        this.timeLabel.node.parent.active = false;*/
        this.enableBet = false;
        this.gameCommonCtrl.onGameBetEnd();
        this.node.stopAllActions();
    },

    onGameEnd(data){
        this.gameResultData = data;
        if (this.enableBet) this.onBetStop();
        this.node.stopAllActions();
        let actions = [cc.delayTime(this.enableBet?2:0.1), cc.callFunc(this.onShowCard.bind(this)), cc.delayTime(2.5), cc.callFunc(this.onShowWin.bind(this)), cc.delayTime(2), cc.callFunc(this.onShowResult.bind(this))];
        this.node.runAction(cc.sequence(actions));
    },

    onShowCard(isAnim){
        if (!this.gameResultData) return;
        this.longCardSprite.node.active = true;
        this.huCardSprite.node.active = true;
        this.longCardSprite.node.position = this.longCardPos;
        this.huCardSprite.node.position = this.huCardPos;
        if(isAnim){
            this.cardAnimation(this.longCardSprite, this.gameResultData.longCard, 0.2);
            this.cardAnimation(this.huCardSprite, this.gameResultData.huCard, 1);
        }else{
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + this.gameResultData.longCard, this.longCardSprite);
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + this.gameResultData.huCard, this.huCardSprite);
        }
    },

    cardAnimation: function (cardSprite, cardData, delayTime) {
        let actions = [];
        let originalPos = {x: cardSprite.node.x, y: cardSprite.node.y};
        let originalScale = {x: cardSprite.node.scaleX, y: cardSprite.node.scaleY};
        actions.push(cc.delayTime(delayTime));
        actions.push(cc.callFunc(function () {
            Global.AudioManager.playSound('GameCommon/Sound/flipcard');
        }));
        actions.push(cc.moveBy(0.2, 10, originalPos.y));
        actions.push(cc.spawn([cc.scaleTo(0.1, 0.1, originalScale.y), cc.moveBy(0.1, -10, originalPos.y + 10)]));
        actions.push(cc.callFunc(function () {
            Global.CCHelper.updateSpriteFrame('GameCommon/Card/' + cardData, cardSprite);

            Global.AudioManager.playSound("LongHuDou/Sound/lhb_p_" + (cardData & 0x0F));
        }));

        actions.push(cc.spawn([cc.scaleTo(0.1, originalScale.x, originalScale.y), cc.moveTo(0.1, originalPos.x, originalPos.y)]));
        let temp = cc.moveTo(0.3, originalPos.x, originalPos.y);
        temp.easing(cc.easeBackOut());
        actions.push(temp);

        cardSprite.node.runAction(cc.sequence(actions));
    },

    onDispatchCard(){
        this.longCardSprite.node.active = true;
        this.huCardSprite.node.active = true;
        this.longCardSprite.node.stopAllActions();
        this.huCardSprite.node.stopAllActions();
        Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.longCardSprite);
        Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.huCardSprite);
        this.longCardSprite.node.position = cc.p(0, 25);
        let action1 = cc.moveTo(0.2, this.longCardPos);
        action1.easing(cc.easeIn(3.0));
        this.longCardSprite.node.runAction(action1);
        this.huCardSprite.node.position = cc.p(0, 25);
        let action2 = cc.moveTo(0.2, this.huCardPos);
        action2.easing(cc.easeIn(3.0));
        this.huCardSprite.node.runAction(action2);

        Global.AudioManager.playSound("GameCommon/Sound/sendcard");
    },

    onShowWin(){
        if (!this.gameResultData) return;
        let winType = this.gameResultData.winType;
        let nodeName = "";
        let soundUrl = "LongHuDou/Sound/";
        if (winType === gameProto.LONG){
            nodeName = "Long";
            soundUrl += "long_win";
        }else if (winType === gameProto.HU){
            nodeName = "Hu";
            soundUrl += "hu_win";
        }else if (winType === gameProto.HE){
            nodeName = "He";
            soundUrl += "he";
        }
        Global.AudioManager.playSound(soundUrl);
        let node = this.winTypeShowNode.getChildByName(nodeName);
        if (!!node){
            node.active = true;
            let action = cc.sequence([cc.show(), cc.fadeTo(0.3, 255),cc.fadeTo(0.3, 0)]);
            node.opacity = 0;
            node.runAction(cc.repeat(action, 3));
        }
    },

    onShowResult(){
        this.gameCommonCtrl.onGameResult(this.gameResultData.scoreChangeArr);
        this.addDirRecord([this.gameResultData.winType]);
        Global.MessageCallback.emitMessage("UpdateTrendDataNotify", {dirRecordArr: this.dirRecordArr});
    },

    userBet(data, isTween){
        this.betCountList[data.betType] += data.count;
        if (data.uid === model.selfUid){
            this.selfBetCountList[data.betType] += data.count;
        }
        let betRect = cc.rect(0,0,0,0);
        if (data.betType === gameProto.LONG){
            betRect = this.longBetRectNode.getBoundingBox();
        }else if (data.betType === gameProto.HU){
            betRect = this.huBetRectNode.getBoundingBox();
        }else if (data.betType === gameProto.HE){
            betRect = this.heBetRectNode.getBoundingBox();
        }
        this.gameCommonCtrl.userBet(data.uid, data.count, betRect, isTween);
    },

    updateBetCount(betCountList, selfBetCountList){
        this.longBetCountLabel.string = betCountList[gameProto.LONG].toString();
        this.huBetCountLabel.string = betCountList[gameProto.HU].toString();
        this.heBetCountLabel.string = betCountList[gameProto.HE].toString();

        this.selfLongBetCountLabel.string = "下注:" + selfBetCountList[gameProto.LONG].toString();
        this.selfHuBetCountLabel.string = "下注:" + selfBetCountList[gameProto.HU].toString();
        this.selfHeBetCountLabel.string = "下注:" + selfBetCountList[gameProto.HE].toString();
    },

    addDirRecord(dirRecordList){
        this.dirRecordArr = this.dirRecordArr.concat(dirRecordList);
        // 直接出现
        for(let i = 0; i < dirRecordList.length; ++i){
            let node = this.createBetRecordItem(dirRecordList[i]);
            node.parent = this.betRecordItemNode.parent;
            node.x = this.betRecordItemNode.x + this.dirRecordNodeArr.length * this.betRecordItemNode.width;
            node.y = 0;
            node.setScale(0.1);
            node.runAction(cc.scaleTo(0.1 ,1.0));
            this.dirRecordNodeArr.push(node);
            if(this.dirRecordNodeArr.length > 20){
                node.x -= this.betRecordItemNode.width;
                let firstNode = this.dirRecordNodeArr.shift();
                firstNode.destroy();
                this.dirRecordArr.shift();
                for (let j = 0; j < this.dirRecordNodeArr.length - 1; ++j){
                    this.dirRecordNodeArr[j].runAction(cc.moveBy(0.1, cc.p(-this.betRecordItemNode.width, 0)));
                }
            }
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
    
    exitGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this, true);
            Global.CCHelper.releaseRes(['LongHuDou']);
        }.bind(this));
    }
});
