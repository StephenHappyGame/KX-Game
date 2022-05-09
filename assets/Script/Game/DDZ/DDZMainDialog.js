let roomProto = require('../../API/RoomProto');
let gameProto = require('./DDZProto');
let roomAPI = require('../../API/RoomAPI');
let gameLogic = require('./gameLogic');

cc.Class({
    extends: cc.Component,

    properties: {
        handCardWidgetCtrl: require('DDZHandCradWidgetCtrl'),
        operationBtnWidgetCtrl: require('DDZOperationBtnWdigetCtrl'),
        cardCountLabelArr: [cc.Label],
        showTipNodeArr: [cc.Node],
        showOutCardNodeArr: [cc.Node],
        clockPosNodeArr: [cc.Node],
        showHandCardNode: [cc.Node],
        landScoreLabel: cc.Label,
        nicknameLabelArr: [cc.Label],
        goldLabelArr: [cc.Label],
        userIconSpriteArr: [cc.Sprite],
        showOutCardWidgetPrefab: cc.Prefab,
        showHandCardWidgetPrefab: cc.Prefab,
        clockWidgetPrefab: cc.Prefab,
        backCardNode: cc.Node,
        landCapNodeArr: [cc.Node],

        cardNode: cc.Node,
        shunziAnimationPrefab: cc.Prefab,
        zhandanAnimationPrefab: cc.Prefab,
        huojianAnimationPrefab: cc.Prefab,
        huojianGuangAnimationPrefab: cc.Prefab,
        animationNode: cc.Node,

        fieldInfoLabel: cc.Label,

        trusteeshipNode: cc.Node
    },

    onLoad: function () {
        this.gameInited = false;

        this.myChairID = -1;
        this.roomID = "";
        this.baseScore = 1;
        this.bankerUserChairID = -1;

        this.handCardWidgetCtrl.initWidget();

        this.turnCardDataArr = [];

        this.landCapNode = null;

        this.roomUserInfoArr = [null, null, null];

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        
        // 获取场景
        this.scheduleOnce(function () {
            roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
        }, 0.2);

        //
        Global.AudioManager.startPlayBgMusic("Game/DDZ/Sound/sound_bg");
    },

    onDestroy: function () {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
    },

    messageCallbackHandler: function(router, msg) {
        if(router === 'RoomMessagePush') {
            if(msg.type === roomProto.USER_LEAVE_ROOM_RESPONSE) {
                if(msg.data.chairId === this.myChairID) {
                    Global.DialogManager.removeLoadingCircle();
                }
            } else if(msg.type === roomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
                if(!this.gameInited) return;
                // 设置信息
                this.onUserEntryRoom(msg.data.roomUserInfo);
            } else if(msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if(!this.gameInited) return;
                // 删除用户信息
                this.onUserLeaveRoom(msg.data.roomUserInfo);
            } else if(msg.type === roomProto.USER_READY_PUSH) {
                if(!this.gameInited) return;
                // 用户准备
                this.onUserReady(msg.data.chairId);
            } else if(msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH){
                this.gameInit(msg.data.roomUserInfoArr, msg.data.gameData);
            } else if (msg.type === roomProto.ROOM_USER_INFO_CHANGE_PUSH){
                if(!this.gameInited) return;
                for (let i = 0; i < this.roomUserInfoArr.length; ++i){
                    if (this.roomUserInfoArr[i].userInfo.uid === msg.data.changeInfo.uid){
                        this.roomUserInfoArr[i].userInfo = msg.data.changeInfo;
                        break;
                    }
                }
            }
        } else if(router === 'GameMessagePush') {
            if (!this.gameInited) return;
            if(msg.type === gameProto.GAME_SEND_CARD_PUSH) {
                this.onGameSendCard(msg.data.curChairID, msg.data.selfCardArr);
            } else if(msg.type === gameProto.GAME_SNATCH_LANDLORD_PUSH) {
                this.onUserSnatchLand(msg.data.chairID, msg.data.score, msg.data.curChairID, msg.data.curMaxScore);
            } else if(msg.type === gameProto.GAME_START_PUSH) {
                this.onGameStart(msg.data.landChairID, msg.data.landScore, msg.data.backCardArr);
            } else if(msg.type === gameProto.GAME_USER_OUT_CARD_PUSH) {
                this.onUserOutCard(msg.data.chairID, msg.data.outCardArr, msg.data.curChairID, msg.data.leftCardCount);
            } else if(msg.type === gameProto.GAME_USER_PASS_PUSH) {
                this.onUserPass(msg.data.chairID, msg.data.curChairID, msg.data.isNewTurn);
            } else if(msg.type === gameProto.GAME_RESULT_PUSH){
                this.onGameResult(msg.data);
            }
        } else if(router === 'ReConnectSuccess') {
            if(Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(this.roomID, function() {
                    roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
                }, function () {
                    this.exitGame();
                }.bind(this));
            } else {
                this.exitGame();
            }
        }
    },
    
    onBtnClick: function (event, parameter) {
        if (!this.gameInited) return;
        Global.AudioManager.playCommonSoundClickButton();
        if (parameter === 'ready'){
            let node = this.operationBtnWidgetCtrl.getClockNode();
            if(!!node) node.destroyAllChildren();

            this.operationBtnWidgetCtrl.clearWidget();

            Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: this.gameTypeInfo.gameTypeID});
            // roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));
        } else if (parameter === 'point0'){
            this.onSelfSnatchLand(0);
        } else if (parameter === 'point1'){
            this.onSelfSnatchLand(1);
        } else if (parameter === 'point2'){
            this.onSelfSnatchLand(2);
        } else if (parameter === 'point3'){
            this.onSelfSnatchLand(3);
        } else if (parameter === 'pass'){
            this.selfOutCardCallback(null);
        } else if (parameter === 'tip'){
            if (!!this.turnCardDataArr && this.turnCardDataArr.length > 0){
                if (!this.handCardWidgetCtrl.searchOutCard(this.turnCardDataArr)){
                    this.selfOutCardCallback(null);
                }
            }
        } else if (parameter === 'outCard'){
            let selectedCardDataArr = this.handCardWidgetCtrl.getSelectedCard();
            this.selfOutCardCallback(selectedCardDataArr);
        } else if (parameter === 'exit'){
            if (!this.gameInited) return;
            Global.DialogManager.addPopDialog('确认退出游戏?', function() {
                if (!Global.Player.getPy('roomID')){
                    this.exitGame();
                }else{
                    roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
                    Global.DialogManager.addLoadingCircle();
                }
            }.bind(this), function() {});
        } else if (parameter === 'settings'){
            //this.onReconnection();
            Global.DialogManager.createDialog('Setting/SettingDialog');
            //this.showLandCapAnimation(0, true);
            //this.showSendCardAnimation();
            //this.showShunziAnimation();
            //this.showLianduiAnimation(cc.p(0, -200));
            //this.showFeijiAnimation();

            //this.showZhadanAnimation();

            //Global.DialogManager.createDialog('Game/DDZ/DDZResultDialog');

            //this.showHuojianAnimation();
        } else if (parameter === 'trusteeship'){
            if (!!this.trusteeshipNode.active) return;
            this.trusteeshipNode.active = true;
            let node = this.operationBtnWidgetCtrl.getClockNode();
            if (!node) return;
            let clockNode = node.children[0];
            if (!!clockNode && !!clockNode.active){
                let clockCtrl = clockNode.getComponent("DDZClockWidgetCtrl");
                if (!!clockCtrl){
                    clockCtrl.setClockEnd();
                }
            }
        } else if (parameter === 'trusteeshipCancel'){
            this.trusteeshipNode.active = false;
        } else if (parameter === 'help'){
            Global.DialogManager.createDialog("GameCommon/GameRule/GameRuleDialog",{kind:Global.Enum.gameType.DDZ})
        }
    },

    gameInit: function (roomUserInfoArr, gameData) {
        this.gameInited = true;
        this.gameTypeInfo = gameData.gameTypeInfo;
        // 获取自己的位置
        for (let i = 0; i < roomUserInfoArr.length; ++i){
            let roomUserInfo = roomUserInfoArr[i];
            if (roomUserInfo.userInfo.uid === Global.Player.getPy('uid')){
                this.myChairID = roomUserInfo.chairId;
                break;
            }
        }
        // 设置场信息
        let fieldName = "";
        if (gameData.gameTypeInfo.level === 1){
            fieldName = "初级场";
        } else if (gameData.gameTypeInfo.level === 2){
            fieldName = "中级场";
        } else if (gameData.gameTypeInfo.level === 3){
            fieldName = "高级场";
        } else if (gameData.gameTypeInfo.level === 4){
            fieldName = "大师场";
        }
        this.fieldInfoLabel.string = "斗地主 " + fieldName + "  底分 " + gameData.baseScore;
        // 设置用户信息
        for (let i = 0; i < roomUserInfoArr.length; ++i){
            this.onUserEntryRoom(roomUserInfoArr[i]);
        }
        // 设置底分
        this.baseScore = gameData.baseScore;
        // 记录抽水比例
        this.profitPercentage = gameData.profitPercentage;
        // 未开局状态
        if(gameData.gameStatus === gameProto.gameStatus.NONE){
            /*// 显示准备按钮
            this.operationBtnWidgetCtrl.startReady();
            // 设置定时器
            this.showClock(this.myChairID, gameProto.READY_TIME, function () {
                roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Global.DialogManager.addLoadingCircle();
            }.bind(this));*/
            // 进入房间自动准备
            roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));
        } else if (gameData.gameStatus === gameProto.gameStatus.SNATCH_LANDLORD){
            // 设置手牌
            this.handCardWidgetCtrl.onSendCard(gameData.selfCardArr, false);

            for (let i = 0; i < 3; ++i){
                // 设置其他玩家手牌数
                this.updateCardCount(i, gameData.allUserCardCountArr[i]);
                // 设置所有玩家的叫分
                this.updateCallLandScore(i, gameData.snatchScoreArr[i])
            }
            // 设置当前倍数
            this.landScoreLabel.string = gameData.landScore.toString();
            // 如果轮到自己叫分，则显示叫分按钮
            if(gameData.curChairID === this.myChairID){
                this.operationBtnWidgetCtrl.startCallLand(gameData.landScore + 1);
            }
            // 设置定时器
            this.showClock(gameData.curChairID, gameProto.SNATCH_LANDLORD_TIME, this.autoCallScore.bind(this));
        } else if (gameData.gameStatus === gameProto.gameStatus.OUT_CARD){
            // 设置手牌
            this.handCardWidgetCtrl.onSendCard(gameData.selfCardArr, false);
            this.handCardWidgetCtrl.startGame();
            // 设置显示庄家
            this.bankerUserChairID = gameData.bankerUserChairID;
            this.showLandCapAnimation(this.bankerUserChairID, false);
            // 设置其他玩家手牌数
            for (let i = 0; i < 3; ++i){
                // 设置其他玩家手牌数
                this.updateCardCount(i, gameData.allUserCardCountArr[i]);
            }
            // 设置当前倍数
            this.landScoreLabel.string = gameData.landScore.toString();
            // 显示底牌
            let cardNode = cc.instantiate(this.showOutCardWidgetPrefab);
            cardNode.getComponent("DDZShowOutCardWidgetCtrl").initWidget(gameData.backCardArr);
            cardNode.parent = this.backCardNode;
            // 设置上一轮出牌
            // 不是新的一轮则记录上一轮出牌
            this.turnCardDataArr = gameData.turnCardDataArr;
            // 如果是自己出牌，则显示出牌按钮
            if(gameData.curChairID === this.myChairID){
                this.operationBtnWidgetCtrl.startOutCard(gameData.curChairID === gameData.turnWinerChairID);
            }
            // 设置定时器
            this.showClock(gameData.curChairID, gameProto.OUT_CARD_TIME, this.autoOutCard.bind(this));
        }
    },

    resetGame: function (isRetainReady) {
        // 清除手牌
        this.handCardWidgetCtrl.resetWidget();
        // 清除所有提示
        this.clearState(isRetainReady);
        // 清除所有出牌
        for(let i = 0; i < 3; ++i){
            this.showOutCardNodeArr[i].removeAllChildren();
        }
        // 清除底牌
        this.backCardNode.removeAllChildren();
        // 清除闹钟
        for (let i = 0; i < 3; ++i){
            if (i === 0){
                let node = this.operationBtnWidgetCtrl.getClockNode();
                if(node) node.destroyAllChildren();
            }else{
                this.clockPosNodeArr[i].destroyAllChildren();
            }
        }
        // 清除按钮
        this.operationBtnWidgetCtrl.clearWidget();
        // 隐藏牌数
        for (let i = 1; i < 3; ++i){
            this.cardCountLabelArr[i].node.parent.active = false;
        }
        // 清除上轮牌
        this.turnCardDataArr = [];
        // 清除地主标识
        this.landCapNode.destroy();
        this.landCapNode = null;
        this.bankerUserChairID = -1;
        // 清楚手牌显示
        for(let i = 0; i < this.showHandCardNode.length; ++i){
            this.showHandCardNode[i].removeAllChildren();
        }
        // 清除倍数
        this.landScoreLabel.string = '0';
        // 清除发牌动画
        this.stopSendCardAnimation();
        // 清除托管
        this.trusteeshipNode.active = false;
    },

    onReconnection: function () {
        this.resetGame();
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },
    
    onUserEntryRoom: function (roomUserInfo) {
        // 设置用户角色、昵称、金币
        let index = this.getUserChairIndex(roomUserInfo.chairId);
        this.nicknameLabelArr[index].string = Global.Player.convertNickname(roomUserInfo.userInfo.nickname);
        this.goldLabelArr[index].string = roomUserInfo.userInfo.gold.toFixed(2);
        Global.CCHelper.updateSpriteFrame(roomUserInfo.userInfo.avatar, this.userIconSpriteArr[index]);
        if (index > 0) this.nicknameLabelArr[index].node.parent.active = true;

        if ((roomUserInfo.userStatus & roomProto.userStatusEnum.READY) !== 0 && (roomUserInfo.userStatus & roomProto.userStatusEnum.PLAYING) === 0){
            this.onUserReady(roomUserInfo.chairId);
        }
        this.roomUserInfoArr[roomUserInfo.chairId] = roomUserInfo;
    },

    onUserLeaveRoom: function (roomUserInfo) {
        // 删除用户信息
        if(roomUserInfo.chairId === this.myChairID){
            this.exitGame();
        }else{
            let index = this.getUserChairIndex(roomUserInfo.chairId);
            this.nicknameLabelArr[index].node.parent.active = false;

            // 显示准备状态
            //this.showTipNodeArr[index].getChildByName('ready').active = false;

            this.roomUserInfoArr[roomUserInfo.chairId] = null;
        }
    },

    updateUserInfo: function () {
        for (let i = 0; i < 3; ++i){
            let roomUserInfo = this.roomUserInfoArr[i];
            if (i === this.myChairID){
                let index = this.getUserChairIndex(i);
                this.goldLabelArr[index].string = Global.Player.getPy('gold').toString();
            }else{
                if (!!roomUserInfo){
                    let index = this.getUserChairIndex(roomUserInfo.chairId);
                    this.goldLabelArr[index].string = roomUserInfo.userInfo.gold.toFixed(2);
                }
            }
        }
    },
    
    onUserReady: function (chairID) {
        // 显示准备状态
        /*let index = this.getUserChairIndex(chairID);
        this.showTipNodeArr[index].getChildByName('ready').active = true;*/
    },

    onGameSendCard: function (curChairID, selfCardDataArr) {
        if (this.handCardWidgetCtrl.getAllCard().length !== 0){
            this.handCardWidgetCtrl.resetWidget();
        }
        // 清除状态
        this.clearState();
        // 开始发牌
        this.handCardWidgetCtrl.onSendCard(selfCardDataArr, true,function (index) {
            for (let i = 0; i < 3; ++i){
                this.updateCardCount(i, index);
            }
            Global.AudioManager.playSound("Game/DDZ/Sound/sound_send_card");
            if (index === 17){
                // 发牌动画结束后，第一个玩家开始叫分
                this.onStartSnatchLand(curChairID, 0);
                // 停止动画
                this.stopSendCardAnimation();
            }
        }.bind(this));
        // 播放发牌动画
        this.showSendCardAnimation();
        // 显示玩家牌数
        for(let i = 0; i < 3; ++i){
            this.updateCardCount(i, 17);
        }
    },
    
    onStartSnatchLand: function (curChairID, minScore) {
        // 如果是自己操作，则显示按钮
        if (curChairID === this.myChairID){
            this.operationBtnWidgetCtrl.startCallLand(minScore);
        }
        // 设置倒计时
        let clockTime = gameProto.SNATCH_LANDLORD_TIME;
        if(!!this.trusteeshipNode.active && curChairID === this.myChairID){
            clockTime = 1;
        }
        this.showClock(curChairID, clockTime, this.autoCallScore.bind(this));
    },

    onSelfSnatchLand: function (score) {
        // 停止计时器
        let clockNode = this.operationBtnWidgetCtrl.getClockNode();
        if (!!clockNode){
            clockNode.destroyAllChildren();
        }else{
            console.error("selfOutCardCallback");
        }
        // 隐藏按钮
        this.operationBtnWidgetCtrl.clearWidget();
        // 发送叫地主请求
        roomAPI.gameMessageNotify(gameProto.gameUserSnatchLandlordNotify(score));
    },
    
    onUserSnatchLand: function (chairID, score, curChairID, curMaxScore) {
        // 显示叫分状态
        this.updateCallLandScore(chairID, score);
        // 停止定时器
        let index = this.getUserChairIndex(chairID);
        this.clockPosNodeArr[index].destroyAllChildren();
        // 设置下一个开始叫分
        if(curChairID >= 0){
            this.onStartSnatchLand(curChairID, curMaxScore + 1);
        }
    },
    
    onGameStart: function (landChairID, landScore, backCardArr) {
        // 清除状态
        this.clearState();
        // 显示地主标识
        this.bankerUserChairID = landChairID;
        this.showLandCapAnimation(this.bankerUserChairID, true);
        // 显示倒计时
        //this.showClock(landChairID, gameProto.OUT_CARD_TIME, this.autoOutCard.bind(this));
        // 设置当前倍数
        this.landScoreLabel.string = landScore.toString();
        this.handCardWidgetCtrl.startGame();
        if (landChairID >= 0){
            if (landChairID === this.myChairID){
                this.handCardWidgetCtrl.addCard(backCardArr);
            }
            this.onUserStartOutCard(landChairID, true);
            this.updateCardCount(landChairID, 20);
        }
        // 显示底牌
        let cardNode = cc.instantiate(this.showOutCardWidgetPrefab);
        cardNode.getComponent("DDZShowOutCardWidgetCtrl").initWidget(backCardArr);
        cardNode.parent = this.backCardNode;
    },
    
    onUserStartOutCard: function (chairID, isNewTurn) {
        let index = this.getUserChairIndex(chairID);
        // 设置下一个出牌玩家
        if (chairID === this.myChairID){
            this.operationBtnWidgetCtrl.startOutCard(isNewTurn);
        }
        // 清理自己家的出牌
        let tipsNode = this.showTipNodeArr[index];
        for (let i = 0; i < tipsNode.children.length; ++i){
            tipsNode.children[i].active = false;
        }
        this.showOutCardNodeArr[index].removeAllChildren();
        // 开启定时器
        let clockTime = gameProto.OUT_CARD_TIME;
        if(!!this.trusteeshipNode.active && chairID === this.myChairID){
            clockTime = 1;
        }
        this.showClock(chairID, clockTime, this.autoOutCard.bind(this));
    },

    selfOutCardCallback: function (cardDataArr) {
        if (!cardDataArr){
            // 停止计时器
            let clockNode = this.operationBtnWidgetCtrl.getClockNode();
            if (!!clockNode){
                clockNode.destroyAllChildren();
            }else{
                console.error("selfOutCardCallback");
            }
            // 隐藏按钮
            this.operationBtnWidgetCtrl.clearWidget();
            // 重置手牌位置
            this.handCardWidgetCtrl.resetCardPos();
            this.handCardWidgetCtrl.resetSearchOutCardState();

            let index = this.getUserChairIndex(this.myChairID);
            this.showTipNodeArr[index].getChildByName('pass').active = true;

            // 发送消息
            roomAPI.gameMessageNotify(gameProto.gameUserPassNotify());
        }else{
            if (cardDataArr.length === 0){
                // 提示
                //Global.DialogManager.addTipDialog('出牌错误');
                return;
            }
            // 检查牌是否符合要求
            cardDataArr = gameLogic.sortCardList(cardDataArr);
            let cardType = gameLogic.getCardType(cardDataArr);
            if (cardType === gameProto.cardType.ERROR){
                // 提示
                Global.DialogManager.addTipDialog('出牌不符合规则');
                return;
            }
            if (this.turnCardDataArr.length > 0){
                if (!gameLogic.compareCard(this.turnCardDataArr, cardDataArr)){
                    // 提示错误
                    Global.DialogManager.addTipDialog('出牌必须大过上轮');
                    return;
                }
            }
            // 停止计时器
            let clockNode = this.operationBtnWidgetCtrl.getClockNode();
            if (!!clockNode){
                clockNode.destroyAllChildren();
            }else{
                console.error("selfOutCardCallback");
            }
            // 隐藏按钮
            this.operationBtnWidgetCtrl.clearWidget();
            // 出牌
            roomAPI.gameMessageNotify(gameProto.gameUserOutCardNotify(cardDataArr));
            // 删除牌
            this.handCardWidgetCtrl.removeCard(cardDataArr);
            this.handCardWidgetCtrl.resetSearchOutCardState();

            let index = this.getUserChairIndex(this.myChairID);
            // 播放出牌音效
            this.playOutCardSound(!this.turnCardDataArr || this.turnCardDataArr.length === 0, cardDataArr);
            this.turnCardDataArr = cardDataArr;
            // 显示出牌
            let node = cc.instantiate(this.showOutCardWidgetPrefab);
            node.parent = this.showOutCardNodeArr[index];
            let ctrl = node.getComponent('DDZShowOutCardWidgetCtrl');
            ctrl.initWidget(cardDataArr, index);
            // 播放动画
            this.playOutCardAnimation(cardDataArr, ctrl);
            // 计算倍数
            if(cardType >= gameProto.cardType.BOMB_CARD){
                // 更新倍数
                this.landScoreLabel.string = (parseInt(this.landScoreLabel.string) * 2 ).toString();
            }
        }
    },

    onUserOutCard: function (chairID, cardDataArr, curChairID, leftCardCount) {
        let index = this.getUserChairIndex(chairID);
        if (chairID !== this.myChairID){
            // 播放出牌音效
            this.playOutCardSound(!this.turnCardDataArr || this.turnCardDataArr.length === 0, cardDataArr);
            this.turnCardDataArr = cardDataArr;
            // 显示出牌
            let node = cc.instantiate(this.showOutCardWidgetPrefab);
            node.parent = this.showOutCardNodeArr[index];
            let ctrl = node.getComponent('DDZShowOutCardWidgetCtrl');
            ctrl.initWidget(cardDataArr, index);
            // 播放动画
            this.playOutCardAnimation(cardDataArr, ctrl);
            // 计算倍数
            let cardType = gameLogic.getCardType(cardDataArr);
            if(cardType >= gameProto.cardType.BOMB_CARD){
                // 更新倍数
                this.landScoreLabel.string = (parseInt(this.landScoreLabel.string) * 2 ).toString();
            }
        }

        // 清除定时器
        this.clockPosNodeArr[index].destroyAllChildren();
        // 更新玩家手牌数
        this.updateCardCount(chairID, leftCardCount);
        // 设置下一个出牌玩家
        if (curChairID >= 0){
            this.onUserStartOutCard(curChairID, false);
        }
    },

    playOutCardSound: function (isFirst, cardDataArr) {
        let cardType = gameLogic.getCardType(cardDataArr);
        if (cardType === gameProto.cardType.SINGLE){
            let value = gameLogic.getCardValue(cardDataArr[0]);
            Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_" + value);
        } else if (cardType === gameProto.cardType.DOUBLE){
            let value = gameLogic.getCardValue(cardDataArr[0]);
            Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_dui" + value);
        } else if (cardType === gameProto.cardType.THREE){
            let value = gameLogic.getCardValue(cardDataArr[0]);
            Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_tuple" + value);
        } else if (cardType === gameProto.cardType.SINGLE_LINE){
            if (isFirst){
                Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_shunzi");
            } else{
                Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.DOUBLE_LINE){
            if (isFirst){
                Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_liandui");
            } else{
                Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.THREE_LINE){
            if (isFirst){
                Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_feiji");
            } else{
                Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.THREE_LINE_TAKE_ONE){
            if (isFirst){
                if (cardDataArr.length === 4){
                    Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_sandaiyi");
                }else{
                    Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_feiji");
                }
            } else{
                Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.THREE_LINE_TAKE_TWO){
            if (isFirst){
                if (cardDataArr.length === 5){
                    Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_sandaiyidui");
                }else{
                    Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_feiji");
                }
            } else{
                Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.BOMB_CARD){
            Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_zhadan");
        } else if (cardType === gameProto.cardType.FOUR_LINE_TAKE_ONE){
            Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_sidaier");
        } else if (cardType === gameProto.cardType.FOUR_LINE_TAKE_TWO){
            Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_sidailiangdui");
        } else if (cardType === gameProto.cardType.MISSILE_CARD){
            Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_wangzha");
        }
    },

    playOutCardAnimation: function (cardDataArr, ctrl) {
        let cardType = gameLogic.getCardType(cardDataArr);
        if (cardType === gameProto.cardType.BOMB_CARD){
            this.showZhadanAnimation();
        } else if (cardType === gameProto.cardType.THREE_LINE_TAKE_ONE){
            if (cardDataArr.length > 4){
                this.showFeijiAnimation();
            }
        } else if (cardType === gameProto.cardType.THREE_LINE_TAKE_TWO){
            if (cardDataArr.length > 5){
                this.showFeijiAnimation();
            }
        } else if (cardType === gameProto.cardType.MISSILE_CARD){
            this.showHuojianAnimation();
        } else if (cardType === gameProto.cardType.SINGLE_LINE){
            this.showShunziAnimation(null, ctrl);
        } else if (cardType === gameProto.cardType.DOUBLE_LINE){
            this.showLianduiAnimation(null, ctrl);
        }
    },
    
    onUserPass: function (chairID, curChairID, isNewTurn){
        // 显示pass状态
        let index = this.getUserChairIndex(chairID);
        if (chairID !== this.myChairID){
            this.showTipNodeArr[index].getChildByName('pass').active = true;
        }
        if (isNewTurn){
            this.turnCardDataArr = [];
        }
        // 删除定时器
        if (index !== 0){
            this.clockPosNodeArr[index].destroyAllChildren();
        }
        // 设置下一个出牌玩家
        if (curChairID >= 0){
            this.onUserStartOutCard(curChairID, isNewTurn);
        }

        Global.AudioManager.playSound("Game/DDZ/Sound/Man/Man_buyao1");
    },
    
    onGameResult: function (resultData) {
        // 显示手牌
        for (let i = 0; i < 3; ++i){
            let index = this.getUserChairIndex(i);
            if (index === 0) continue;
            let cardArr = resultData.allCardArr[i];
            if (cardArr.length > 0){
                for (let j = 0; j < cardArr.length; j+=10){
                    let node = cc.instantiate(this.showHandCardWidgetPrefab);
                    let ctrl = node.getComponent('DDZShowHandCardWidgetCtrl');
                    ctrl.initWidget(cardArr.slice(j, j + 10), index);
                    node.parent = this.showHandCardNode[index];
                }
            }
        }
        // 播放音效
        if ((resultData.isLandWin && this.bankerUserChairID === this.myChairID) || (!resultData.isLandWin && this.bankerUserChairID !== this.myChairID)){
            Global.AudioManager.playSound("Game/DDZ/Sound/sound_win");
        }else{
            Global.AudioManager.playSound("Game/DDZ/Sound/sound_lose");
        }
        // 显示结果
        this.scheduleOnce(function () {
            // 创建结束界面
            let dialogParameters = {
                resultData: resultData,
                myChairID: this.myChairID,
                baseScore: this.baseScore,
                profitPercentage: this.profitPercentage,
                bankerUserChairID: this.bankerUserChairID,
                buttonEventCallback: this.onBtnClick.bind(this)
            };
            Global.DialogManager.createDialog('Game/DDZ/DDZResultDialog', dialogParameters, function () {
                this.resetGame();
                /*// 显示准备按钮
                this.operationBtnWidgetCtrl.startReady();
                // 设置定时器
                this.showClock(this.myChairID, gameProto.READY_TIME + 10, function () {
                    roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
                    Global.DialogManager.addLoadingCircle();
                }.bind(this));*/
            }.bind(this));

            // 刷新用户信息
            this.updateUserInfo();
        }.bind(this), 3);
    },

    autoCallScore: function () {
        this.onSelfSnatchLand(0);
    },

    autoOutCard: function () {
        if (!this.trusteeshipNode.active){
            let autoCardArr = null;
            if (this.turnCardDataArr.length === 0){
                let handCardDataArr = this.handCardWidgetCtrl.getAllCard();
                autoCardArr = [handCardDataArr[handCardDataArr.length - 1]];
            }
            this.selfOutCardCallback(autoCardArr);
        }else{
            let autoCardArr = null;
            if (this.turnCardDataArr.length === 0){
                let handCardDataArr = this.handCardWidgetCtrl.getAllCard();
                if (!!gameLogic.getCardType(handCardDataArr)){
                    autoCardArr = handCardDataArr.slice();
                }else{
                    autoCardArr = [handCardDataArr[handCardDataArr.length - 1]];
                }
            }else{
                if (!!this.handCardWidgetCtrl.searchOutCard(this.turnCardDataArr)){
                    autoCardArr = this.handCardWidgetCtrl.getSelectedCard();
                }
            }
            this.selfOutCardCallback(autoCardArr);
        }
    },

    showClock: function (chairID, time, timeOutCallback) {
        let node = cc.instantiate(this.clockWidgetPrefab);
        let ctrl = node.getComponent('DDZClockWidgetCtrl');
        let index = this.getUserChairIndex(chairID);
        if (index === 0){
            node.parent = this.operationBtnWidgetCtrl.getClockNode();
        }else{
            node.parent = this.clockPosNodeArr[index];
        }
        ctrl.startClock(time, (this.myChairID === chairID)?timeOutCallback:null);
    },

    updateCardCount: function (chairID, count) {
        if (chairID === this.myChairID) return;
        let index = this.getUserChairIndex(chairID);
        this.cardCountLabelArr[index].node.parent.active = true;
        this.cardCountLabelArr[index].string = count.toString();
    },

    updateCallLandScore: function (chairID, count) {
        if (count < 0) return;
        let index = this.getUserChairIndex(chairID);
        let node = this.showTipNodeArr[index].getChildByName('point' + count);
        node.active = true;

        Global.AudioManager.playSound('Game/DDZ/Sound/Man/Man_fen' + count);
    },

    getUserChairIndex: function (chairID) {
        return (chairID - this.myChairID + 3)%3;
    },
    
    clearState: function (isRetainReady) {
        for (let i = 0; i < this.showTipNodeArr.length; ++i){
            let node = this.showTipNodeArr[i];
            for (let j = 0; j < node.children.length; ++j){
                if (isRetainReady && node.children[j].name === 'ready'){
                    if (node.children[j].active) continue;
                }
                node.children[j].active = false;
            }
        }
    },
    
    exitGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this, true);
            Global.DialogManager.destroyDialog('Game/DDZ/DDZResultDialog', true);
            Global.CCHelper.releaseRes(['Game/DDZ']);
        }.bind(this));
    },

    // 动画
    // 发牌动画
    showSendCardAnimation: function () {
        this.cardNode.active = true;
        this.schedule(this.createCard, 0.1);
    },

    // 停止发牌动画
    stopSendCardAnimation: function () {
        this.cardNode.active = false;
        this.unschedule(this.createCard)
    },

    // 创建牌
    createCard: function() {
        let node0 = cc.instantiate(this.cardNode);
        node0.active = true;
        node0.parent = this.cardNode.parent;
        node0.runAction(cc.sequence([cc.moveBy(0.2, cc.p(0, -300)), cc.removeSelf()]));

        let node1 = cc.instantiate(this.cardNode);
        node1.active = true;
        node1.parent = this.cardNode.parent;
        node1.runAction(cc.sequence([cc.moveBy(0.2, cc.p(400, -100)), cc.removeSelf()]));

        let node2 = cc.instantiate(this.cardNode);
        node2.active = true;
        node2.parent = this.cardNode.parent;
        node2.runAction(cc.sequence([cc.moveBy(0.2, cc.p(-400, -100)), cc.removeSelf()]));
    },

    // 显示地主动画
    showLandCapAnimation: function (landChairID, isTween) {
        if (!!this.landCapNode){
            this.landCapNode.destroy();
            this.landCapNode = null;
        }
        this.landCapNode = Global.CCHelper.createSpriteNode("Game/DDZ/img_land_cap");
        let index = this.getUserChairIndex(landChairID);
        let endPosNode = this.landCapNodeArr[index];

        this.landCapNode.parent = endPosNode.parent;
        if (isTween){
            this.landCapNode.scale = 3;
            let action1 = cc.scaleTo(0.2, 1.05);
            action1.easing(cc.easeIn(3));
            let action2 = cc.moveTo(0.2, endPosNode.position);
            action2.easing(cc.easeOut(3));
            let action3 = cc.scaleTo(0.2,1);
            this.landCapNode.runAction(cc.sequence([action1, cc.delayTime(0.3), action2, action3]));
        }else{
            this.landCapNode.x = endPosNode.x;
            this.landCapNode.y = endPosNode.y;
        }
    },
    
    // 顺子
    showShunziAnimation: function (pos, outCardCtrl) {
        if (!pos) pos = outCardCtrl.getCenterPos();
        let node = cc.instantiate(this.shunziAnimationPrefab);
        node.parent = this.animationNode;
        node.position = this.animationNode.convertToNodeSpaceAR(outCardCtrl.node.convertToWorldSpaceAR(pos));
        let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
        ctrl.startAnimation(false, 1, function () {
            ctrl.node.removeFromParent();
        });

        let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/shunzi/shunzi');
        spriteNode.parent = node;
        spriteNode.x = -200;
        let moveAction = cc.moveTo(0.3,cc.p(0,0));
        moveAction.easing(cc.easeOut(3));
        spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
    },

    // 连对
    showLianduiAnimation: function (pos, outCardCtrl) {
        if (!pos) pos = outCardCtrl.getCenterPos();
        let node = cc.instantiate(this.shunziAnimationPrefab);
        node.parent = this.animationNode;
        node.position = this.animationNode.convertToNodeSpaceAR(outCardCtrl.node.convertToWorldSpaceAR(pos));
        let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
        ctrl.startAnimation(false, 1, function () {
            ctrl.node.removeFromParent();
        });

        let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/shunzi/liandui');
        spriteNode.parent = node;
        spriteNode.x = -200;
        let moveAction = cc.moveTo(0.3,cc.p(0,0));
        moveAction.easing(cc.easeOut(3));
        spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
    },
    
    // 飞机
    showFeijiAnimation: function () {
        let feijiSpriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/feiji/1q');
        feijiSpriteNode.parent = this.animationNode;
        feijiSpriteNode.x = -800;
        feijiSpriteNode.y = 0;
        let moveAction1 = cc.moveTo(0.6, cc.p(0, 0));
        moveAction1.easing(cc.easeOut(2));
        let moveAction2 = cc.moveTo(0.6, cc.p(800, 0));
        moveAction2.easing(cc.easeIn(2));
        feijiSpriteNode.runAction(cc.sequence([moveAction1, moveAction2,cc.removeSelf()]));

        this.scheduleOnce(function () {
            let node = cc.instantiate(this.shunziAnimationPrefab);
            node.parent = this.animationNode;
            node.x = 0;
            node.y = -100;
            let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
            ctrl.startAnimation(false, 1, function () {
                ctrl.node.removeFromParent();
            });

            let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/feiji/1w');
            spriteNode.parent = node;
            spriteNode.x = -200;
            spriteNode.y = 0;
            let moveAction = cc.moveTo(0.3,cc.p(0,0));
            moveAction.easing(cc.easeOut(2));
            spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
        }.bind(this), 1);
    },

    // 炸弹
    showZhadanAnimation: function () {
        let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/zhadan/o');
        spriteNode.x = -200;
        spriteNode.parent = this.animationNode;
        spriteNode.runAction(cc.sequence([cc.jumpTo(0.3, cc.p(0, 0), 100, 1), cc.callFunc(function () {
            let node = cc.instantiate(this.zhandanAnimationPrefab);
            node.parent = this.animationNode;
            let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
            ctrl.startAnimation(false, 1, function () {
                ctrl.node.removeFromParent();
            });
            spriteNode.removeFromParent();

            let zhandanNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/zhadan/1');
            zhandanNode.scale = 0.6;
            let action1 = cc.scaleTo(0.5, 1);
            action1.easing(cc.easeBackOut());
            zhandanNode.runAction(cc.sequence([action1, cc.delayTime(0.2), cc.fadeOut(0.3),cc.removeSelf()]));
            zhandanNode.parent = this.animationNode;
        }.bind(this))]));
    },

    // 火箭
    showHuojianAnimation: function () {
        let node = cc.instantiate(this.huojianAnimationPrefab);
        node.parent = this.animationNode;
        let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
        ctrl.startAnimation(false, 1, function () {
            ctrl.node.removeFromParent();
        });

        let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/huojian/11111111');
        spriteNode.parent = this.animationNode;
        let huojianAction1 = cc.moveTo(0.5, cc.p(0, 1000));
        huojianAction1.easing(cc.easeIn(1.5));
        let huojianAction2 = cc.moveTo(0.8, cc.p(0,0));
        huojianAction2.easing(cc.easeIn(2));
        spriteNode.runAction(cc.sequence([huojianAction1, cc.callFunc(function () {
            spriteNode.scaleY = -1;
        }.bind(this)),huojianAction2, cc.callFunc(function () {
            let nodeGuang = cc.instantiate(this.huojianGuangAnimationPrefab);
            nodeGuang.parent = this.animationNode;
            let ctrl = nodeGuang.getComponent('SpriteFrameAnimationWidgetCtrl');
            ctrl.startAnimation(false, 1, function () {
                ctrl.node.removeFromParent();
            });

            let zhandanNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/huojian/2222');
            zhandanNode.scale = 0.6;
            let action1 = cc.scaleTo(0.5, 1);
            action1.easing(cc.easeBackOut());
            zhandanNode.runAction(cc.sequence([action1, cc.delayTime(0.2), cc.fadeOut(0.3),cc.removeSelf()]));
            zhandanNode.parent = this.animationNode;
        }.bind(this)), cc.removeSelf()]));
    }
});
