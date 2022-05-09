let roomProto = require('../../API/RoomProto');
let gameProto = require('./BJProto');
let roomAPI = require('../../API/RoomAPI');
let gameLogic = require('./BJGameLogic');

cc.Class({
    extends: cc.Component,

    properties: {
        userHeadCtrlArr: [require('GameHeadController')],
        readyBtnNode: cc.Node,
        clockWidgetCtrl: require('BJClockWidgetCtrl'),
        betWidgetCtrl: require('BJBetWidgetCtrl'),
        handCardWidgetCtrlArr: [require('BJHandCardWidgetCtrl')],
        bankerHandCardCtrl: require('BJHandCardWidgetCtrl'),
        operationWidgetCtrl: require('BJOperationWidgetCtrl'),
        userStatusNodeArr: [cc.Node],
        showBetWidgetCtrlArr: [require('BJShowBetWidgetCtrl')],
    },

    onLoad: function () {
        this.gameInited = false;

        this.myChairID = -1;
        this.roomID = "";

        this.betCountArr = [0, 0, 0, 0];

        this.playingStatusArr = [];

        this.roomUserInfoArr = [];

        // 初始化
        this.betWidgetCtrl.initWidget();

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        
        // 获取场景
        this.scheduleOnce(function () {
            roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
        }, 0.2);
    },

    onDestroy: function () {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
    },

    messageCallbackHandler: function(router, msg) {
        if(router === 'RoomMessagePush') {
            if(msg.type === roomProto.USER_LEAVE_ROOM_RESPONSE) {
                console.log("RoomMessagePush USER_LEAVE_ROOM_RESPONSE");
                if(msg.data.chairId === this.myChairID) {
                    Global.DialogManager.removeLoadingCircle();
                }
            } else if(msg.type === roomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
                console.log("RoomMessagePush OTHER_USER_ENTRY_ROOM_PUSH");
                if(!this.gameInited) return;
                // 设置信息
                this.onUserEntryRoom(msg.data.roomUserInfo);
            } else if(msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                console.log("RoomMessagePush USER_LEAVE_ROOM_PUSH");
                if(!this.gameInited) return;
                // 删除用户信息
                this.onUserLeaveRoom(msg.data.roomUserInfo);
            } else if(msg.type === roomProto.USER_READY_PUSH) {
                console.log("RoomMessagePush USER_READY_PUSH");
                if(!this.gameInited) return;
                // 用户准备
                this.onUserReady(msg.data.chairId);
            } else if(msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH){
                console.log("RoomMessagePush GET_ROOM_SCENE_INFO_PUSH");
                this.gameInit(msg.data.roomUserInfoArr, msg.data.gameData);
            } else if (msg.type === roomProto.ROOM_USER_INFO_CHANGE_PUSH){
                console.log("RoomMessagePush ROOM_USER_INFO_CHANGE_PUSH");
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
            if(msg.type === gameProto.GAME_START_PUSH) {
                console.log("GameMessagePush GAME_START_PUSH");
                this.onGameStart(msg.data.playingStatusArr);
            }else if(msg.type === gameProto.GAME_SEND_CARD_PUSH) {
                console.log("GameMessagePush GAME_SEND_CARD_PUSH");
                this.onGameSendCard(msg.data.bankerCardArr, msg.data.userCardArr);
            }else if (msg.type === gameProto.GAME_USER_BET_PUSH){
                console.log("GameMessagePush GAME_USER_BET_PUSH");
                this.onUserBet(msg.data.chairID, msg.data.count);
            }else if (msg.type === gameProto.GAME_USER_ADD_CARD_PUSH){
                console.log("GameMessagePush GAME_USER_ADD_CARD_PUSH");
                this.onUserAddCard(msg.data.chairID, msg.data.index, msg.data.userCardArr);
            }else if (msg.type === gameProto.GAME_USER_DOUBLE_BET_PUSH){
                console.log("GameMessagePush GAME_USER_DOUBLE_BET_PUSH");
                this.onUserDouble(msg.data.chairID, msg.data.index, msg.data.userCardArr);
            }else if (msg.type === gameProto.GAME_USER_CUT_CARD_PUSH){
                console.log("GameMessagePush GAME_USER_CUT_CARD_PUSH");
                this.onUserCutCard(msg.data.chairID, msg.data.userCardArr);
            }else if (msg.type === gameProto.GAME_USER_STOP_CARD_PUSH){
                console.log("GameMessagePush GAME_USER_STOP_CARD_PUSH");
                this.onUserStopCard(msg.data.chairID, msg.data.index);
            }else if (msg.type === gameProto.GAME_END_PUSH){
                console.log("GameMessagePush GAME_END_PUSH");
                this.onGameResult(msg.data);
            }else if (msg.type === gameProto.GAME_USER_BUY_INSURANCE_PUSH){
                console.log("GameMessagePush GAME_USER_BUY_INSURANCE_PUSH");
                this.onUserBuyInsurance(msg.data.chairID, msg.data.isBuy);
            }else if (msg.type === gameProto.GAME_INSURANCE_RESULT_PUSH){
                console.log("GameMessagePush GAME_INSURANCE_RESULT_PUSH");
                this.onGameInsuranceResult();
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
            this.clockWidgetCtrl.stopClock();
            this.readyBtnNode.active = false;
            // 清理游戏桌面
            this.resetGame();
            roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));
        } else if (parameter === 'exit'){
            if (!this.gameInited) return;
            Global.DialogManager.addPopDialog('确认退出游戏?', function() {
                if (Global.Player.getPy('roomID')){
                    roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
                    Global.DialogManager.addLoadingCircle();
                }else{
                    this.exitGame();
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
        }else if (parameter === 'help'){
            Global.DialogManager.createDialog("GameCommon/GameRule/GameRuleDialog", {kind: this.gameTypeInfo.kind});
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
        // 设置用户信息
        for (let i = 0; i < roomUserInfoArr.length; ++i){
            this.onUserEntryRoom(roomUserInfoArr[i]);
        }
        // 记录抽水比例
        this.profitPercentage = gameData.profitPercentage;
        // 未开局状态
        if(gameData.gameStatus === gameProto.gameStatus.NONE){
            // 显示准备按钮
            this.readyBtnNode.active = true;
            // 设置定时器
            this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "ready", this.autoOperation.bind(this));
        } else if (gameData.gameStatus === gameProto.gameStatus.WAIT_BET){
            let betCountArr = gameData.betCountArr;
            this.betCountArr = betCountArr;
            this.playingStatusArr = gameData.playingStatusArr;
            for (let i = 0; i < betCountArr.length; ++i){
                if(!this.playingStatusArr[i]) continue;
                let index = this.getUserChairIndex(i);
                // 初始化筹码显示组件
                let headCtrl = this.userHeadCtrlArr[index];
                this.showBetWidgetCtrlArr[index].initWidget(headCtrl.getHeadPos(), betCountArr[i]);
                // 设置金币
                if (!!betCountArr[i]){
                    this.updateUserStatus(this.myChairID, null);
                    headCtrl.goldChange(-betCountArr[i], false);
                }else{
                    this.updateUserStatus(this.myChairID, "bet");
                    if (i === this.myChairID){
                        // 开始下注
                        this.betWidgetCtrl.startBet(headCtrl.getUserInfo().gold, this.selfBet.bind(this));
                        // 开启定时器
                        this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "bet", this.autoOperation.bind(this));
                    }
                }
            }
        } else if (gameData.gameStatus === gameProto.gameStatus.WAIT_BUY_INSURANCE){
            this.betCountArr = gameData.betCountArr;
            this.playingStatusArr = gameData.playingStatusArr;
            let allUserCardArr = gameData.allUserCardArr;

            // 初始化庄家牌
            this.bankerHandCardCtrl.initWidget([gameData.bankerCardArr, null]);
            for (let i = 0; i < this.playingStatusArr.length; ++i){
                if (!this.playingStatusArr[i]) continue;
                let index = this.getUserChairIndex(i);
                // 设置扑克牌
                this.handCardWidgetCtrlArr[index].initWidget(allUserCardArr[i]);
                // 设置下注金额
                let headPos = this.userHeadCtrlArr[index].getHeadPos();
                this.showBetWidgetCtrlArr[index].initWidget(headPos, gameData.betCountArr[i]);
                // 设置实际金币数
                let totalGold = 0;
                totalGold += this.betCountArr[i];
                if (!!gameData.buyInsuranceStatus[i]){
                    totalGold += this.betCountArr[i] * 0.5;
                }
                this.userHeadCtrlArr[index].goldChange(-totalGold, false);
            }

            if (gameData.buyInsuranceStatus[this.myChairID] === null && !!this.playingStatusArr[this.myChairID]){
                Global.DialogManager.addPopDialog("庄家可能会拿到黑杰克，是否购买保险？", function () {
                    this.selfBuyInsurance(true);
                }.bind(this), function () {
                    this.selfBuyInsurance(false);
                }.bind(this));
                this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "insurance", this.autoOperation.bind(this));
            }
        }else if (gameData.gameStatus === gameProto.gameStatus.PLAYING){
            let allUserCardArr = gameData.allUserCardArr;
            let stopCardStatusArr = gameData.stopCardStatusArr;
            this.betCountArr = gameData.betCountArr;
            this.playingStatusArr = gameData.playingStatusArr;

            // 初始化庄家牌
            this.bankerHandCardCtrl.initWidget([gameData.bankerCardArr, null]);

            for (let i = 0; i < this.playingStatusArr.length; ++i){
                if (!this.playingStatusArr[i]) continue;
                let index = this.getUserChairIndex(i);
                // 设置扑克牌
                this.handCardWidgetCtrlArr[index].initWidget(allUserCardArr[i]);
                // 设置下注金额
                let headPos = this.userHeadCtrlArr[index].getHeadPos();
                let cardCount = !!allUserCardArr[i][0]?1:0 + !!allUserCardArr[i][1]?1:0;
                this.showBetWidgetCtrlArr[index].initWidget(headPos, gameData.betCountArr[i], gameData.doubleBetStatusArr[i][0], cardCount > 1);
                // 设置实际金币数
                let totalGold = 0;
                totalGold += this.betCountArr[i];
                if (!!gameData.doubleBetStatusArr[i][0]){
                    totalGold += this.betCountArr[i];
                }
                if (!!allUserCardArr[i][1]){
                    totalGold += this.betCountArr[i];
                }
                if (!!gameData.buyInsuranceStatus[i]){
                    totalGold += this.betCountArr[i] * 0.5;
                }
                this.userHeadCtrlArr[index].goldChange(-totalGold, false);
                // 设置状态
                if (stopCardStatusArr[i][0] === false || stopCardStatusArr[i][1] === false){
                    this.updateUserStatus(i, 'addCard');

                    this.startNext(i, !stopCardStatusArr[i][0]?0:1);
                }else{
                    this.updateUserStatus(i, 'stopCard');
                }
                if (!!stopCardStatusArr[i][0]){
                    this.handCardWidgetCtrlArr[index].stopCard(0);
                }
                if (!!stopCardStatusArr[i][1]){
                    this.handCardWidgetCtrlArr[index].stopCard(1);
                }
            }
        }
    },

    resetGame: function () {
        // 清理庄家牌
        this.bankerHandCardCtrl.initWidget();
        for (let i = 0; i < this.handCardWidgetCtrlArr.length; ++i){
            // 清理手牌
            this.handCardWidgetCtrlArr[i].initWidget();
            // 清理筹码
            this.showBetWidgetCtrlArr[i].initWidget();
        }

    },

    onReconnection: function () {
        this.resetGame();
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },
    
    onUserEntryRoom: function (roomUserInfo) {
        // 设置用户角色、昵称、金币
        let index = this.getUserChairIndex(roomUserInfo.chairId);
        this.userHeadCtrlArr[index].updateInfo(roomUserInfo.userInfo);

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
            // 清理头像
            let index = this.getUserChairIndex(roomUserInfo.chairId);
            this.userHeadCtrlArr[index].updateInfo(null);
            // 显示准备状态
            this.updateUserStatus(roomUserInfo.chairId, null);

            this.roomUserInfoArr[roomUserInfo.chairId] = null;
        }
    },

    updateUserInfo: function () {
        for (let i = 0; i < 4; ++i){
            let roomUserInfo = this.roomUserInfoArr[i];
            if (!!roomUserInfo){
                let index = this.getUserChairIndex(i);
                this.userHeadCtrlArr[index].updateInfo(roomUserInfo.userInfo);
            }
        }
    },
    
    onUserReady: function (chairID) {
        // 显示准备状态
        this.updateUserStatus(chairID, 'ready');
    },

    onGameStart: function (playingStatusArr) {
        // 清除状态
        this.clearState();
        // 记录状态
        this.playingStatusArr = playingStatusArr;
        // 显示倒计时
        this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "bet", this.autoOperation.bind(this));
        // 显示下注
        let index = this.getUserChairIndex(this.myChairID);
        let headCtrl = this.userHeadCtrlArr[index];
        this.betWidgetCtrl.startBet(headCtrl.getUserInfo().gold, this.selfBet.bind(this));
        // 初始化下注组件
        for (let i = 0; i < this.playingStatusArr.length; ++i){
            if (!this.playingStatusArr[i]) continue;
            let index = this.getUserChairIndex(i);
            let headPos = this.userHeadCtrlArr[index].getHeadPos();
            this.showBetWidgetCtrlArr[index].initWidget(headPos);
        }
    },

    selfBet: function(operateType, betCount){
        let index = this.getUserChairIndex(this.myChairID);
        if (operateType === "add"){
            // 投注
            this.showBetWidgetCtrlArr[index].addBetCount(betCount);
            this.userHeadCtrlArr[index].goldChange(-betCount, false);
        }else if (operateType === "bet"){
            let curBetCount = this.betWidgetCtrl.getCurBetCount();
            if (curBetCount === 0) return;
            // 更新状态
            this.updateUserStatus(this.myChairID, "alreadyBet");
            // 停止下注器
            this.betWidgetCtrl.stopBet();
            // 定时器
            this.clockWidgetCtrl.stopClock();
            // 发送下注消息
            roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(curBetCount));
        }else if (operateType === "clean"){
            let curBetCount = this.betWidgetCtrl.getCurBetCount();
            if (curBetCount > 0){
                this.showBetWidgetCtrlArr[index].cleanBet(true);
                this.userHeadCtrlArr[index].goldChange(curBetCount, false);
            }
        }else if (operateType === "autoBet"){
            let curBetCount = this.betWidgetCtrl.getCurBetCount();
            if (curBetCount > 0){
                this.showBetWidgetCtrlArr[index].cleanBet(true);
                this.userHeadCtrlArr[index].goldChange(curBetCount, false);
            }
            curBetCount = this.betWidgetCtrl.getMinBetCount();
            // 投注
            this.showBetWidgetCtrlArr[index].betCount(curBetCount);
            this.userHeadCtrlArr[index].goldChange(-curBetCount, false);
            // 更新状态
            this.updateUserStatus(this.myChairID, "alreadyBet");
            // 停止下注器
            this.betWidgetCtrl.stopBet();
            // 定时器
            this.clockWidgetCtrl.stopClock();
            // 发送下注消息
            roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(curBetCount));
        }

    },

    onUserBet: function(chairID, betCount){
        this.betCountArr[chairID] = betCount;
        let index = this.getUserChairIndex(chairID);
        if(chairID !== this.myChairID){
            // 更新状态
            this.updateUserStatus(chairID, "alreadyBet");
            // 显示下注金额
            this.showBetWidgetCtrlArr[index].betCount(betCount);
            this.userHeadCtrlArr[index].goldChange(-betCount, false);
        }
    },

    selfBuyInsurance: function(isBuy){
        if (isBuy){
            let gold = this.userHeadCtrlArr[this.getUserChairIndex(this.myChairID)].userInfo.gold;
            if (gold < this.betCountArr[this.myChairID]){
                isBuy = false;
                Global.DialogManager.addPopDialog("金币不足无法购买保险");
            }else{
                this.userHeadCtrlArr[this.getUserChairIndex(this.myChairID)].goldChange(-this.betCountArr[this.myChairID] * 0.5, false);
            }
        }
        this.clockWidgetCtrl.stopClock();
        roomAPI.gameMessageNotify(gameProto.gameUserByInsuranceNotify(isBuy));
    },

    onUserBuyInsurance: function(chairID, isBuy){
        if (chairID !== this.myChairID){
            if (isBuy){
                this.userHeadCtrlArr[this.getUserChairIndex(chairID)].goldChange(-this.betCountArr[chairID] * 0.5, false);
            }
        }
    },

    onGameSendCard: function (bankerCardArr, allUserCardArr) {
        // 发庄家的牌
        this.bankerHandCardCtrl.initWidget();
        this.bankerHandCardCtrl.sendCard([bankerCardArr, null]);
        // 发其他玩家的牌
        for (let i = 0; i < this.playingStatusArr.length; ++i){
            if (!this.playingStatusArr[i]) continue;
            let index = this.getUserChairIndex(i);
            this.handCardWidgetCtrlArr[index].initWidget();
            if(i === this.myChairID){
                this.handCardWidgetCtrlArr[index].sendCard(allUserCardArr[i], function () {
                    // 判断是否应该买保险
                    if(gameLogic.getCardValue(bankerCardArr[0]) === 11){
                        Global.DialogManager.addPopDialog("庄家可能会拿到黑杰克，是否购买保险？", function () {
                            this.selfBuyInsurance(true);
                        }.bind(this), function () {
                            this.selfBuyInsurance(false);
                        }.bind(this));
                        this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "insurance", this.autoOperation.bind(this));
                    }else{
                        if (gameLogic.getCardPoint(bankerCardArr) !== 21){
                            // 开始操作
                            this.startNext(this.myChairID, 0);
                        }
                    }
                }.bind(this));
            } else {
                this.handCardWidgetCtrlArr[index].sendCard(allUserCardArr[i]);
            }
        }
    },

    onGameInsuranceResult: function(){
        this.startNext(this.myChairID, 0);
    },

    userOperation: function(operationType, cardIndex){
        let index = this.getUserChairIndex(this.myChairID);
        if (operationType === 'addCard'){
            this.operationWidgetCtrl.stopOperation();
            roomAPI.gameMessageNotify(gameProto.gameUserAddCardNotify(cardIndex));
        }else if (operationType === 'stopCard'){
            roomAPI.gameMessageNotify(gameProto.gameUserStopCardNotify(cardIndex));
            // 检查是否已经全部停牌
            let selfCardDataArr = this.handCardWidgetCtrlArr[index].getCardDataArr();
            if (!selfCardDataArr[cardIndex + 1]){
                this.updateUserStatus(this.myChairID, "stopCard");
            }
        }else if (operationType === 'double'){
            // 更新下注金额
            roomAPI.gameMessageNotify(gameProto.gameUserDoubleBetNotify(cardIndex));
        }else if (operationType === 'cutCard'){
            roomAPI.gameMessageNotify(gameProto.gameUserCutCardNotify());
        }
        // 停止操作器
        this.operationWidgetCtrl.stopOperation();
        // 停止倒计时
        this.clockWidgetCtrl.stopClock();
    },

    startNext: function(chairID, curIndex){
        if (curIndex === 2){
            this.updateUserStatus(chairID, 'stopCard');
            return;
        }
        let index = this.getUserChairIndex(chairID);
        let cardDataArr = this.handCardWidgetCtrlArr[index].getCardDataArr();
        if (!cardDataArr[curIndex]){
            this.updateUserStatus(chairID, 'stopCard');
            return;
        }
        let points = gameLogic.getCardPoint(cardDataArr[curIndex]);
        if (points >= 21){
            if (!cardDataArr[curIndex + 1]){
                this.updateUserStatus(chairID, 'stopCard');
            }else{
                if (this.myChairID === chairID){
                    // 显示操作器
                    let operationTypeArr = ["addCard", "stopCard"];
                    this.handCardWidgetCtrlArr[index].showOperation(curIndex + 1);
                    // 开始操作
                    this.operationWidgetCtrl.startOperation(operationTypeArr, curIndex + 1, this.userOperation.bind(this));
                    // 开始倒计时
                    this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "stopCard", this.autoOperation.bind(this));
                }
            }
        }else{
            if (this.myChairID === chairID){
                // 显示操作器
                let operationTypeArr = ["addCard", "stopCard"];
                // 检查金币是否足够双倍
                let gold = this.userHeadCtrlArr[this.getUserChairIndex(this.myChairID)].userInfo.gold;
                if (gold >= this.betCountArr[this.myChairID] && cardDataArr[curIndex].length === 2 && !cardDataArr[1]){
                    operationTypeArr.push("double");
                    // 检查是否可以分牌
                    if (gameLogic.isCanCutCard(cardDataArr[0])){
                        operationTypeArr.push("cutCard");
                    }
                }
                this.handCardWidgetCtrlArr[index].showOperation(curIndex);
                // 开始操作
                this.operationWidgetCtrl.startOperation(operationTypeArr, curIndex, this.userOperation.bind(this));
                // 开始倒计时
                this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "stopCard", this.autoOperation.bind(this));
            }
        }
    },

    onUserAddCard: function(chairID, cardIndex, userCardArr){
        let index = this.getUserChairIndex(chairID);
        this.handCardWidgetCtrlArr[index].addCard(cardIndex, userCardArr, function () {
            // 开始操作
            this.startNext(chairID, cardIndex);
        }.bind(this));
    },

    onUserStopCard: function(chairID, cardIndex){
        let handCardWidgetCtrl = this.handCardWidgetCtrlArr[this.getUserChairIndex(chairID)];
        handCardWidgetCtrl.stopCard(cardIndex);
        // 开始操作
        this.startNext(chairID, cardIndex + 1);
    },

    onUserDouble: function(chairID, cardIndex, userCardArr){
        let index = this.getUserChairIndex(chairID);
        this.showBetWidgetCtrlArr[index].double();
        this.userHeadCtrlArr[index].goldChange(-this.betCountArr[chairID], false);
        this.handCardWidgetCtrlArr[index].addCard(cardIndex, userCardArr, function () {
            this.onUserStopCard(chairID, cardIndex);
        }.bind(this));
    },

    onUserCutCard: function(chairID, userCardArr){
        let index = this.getUserChairIndex(chairID);
        let handCtrl = this.handCardWidgetCtrlArr[index];
        this.showBetWidgetCtrlArr[index].cutCard();
        this.userHeadCtrlArr[index].goldChange(-this.betCountArr[chairID], false);
        handCtrl.cutCard(userCardArr, function () {
            this.startNext(chairID, 0);
        }.bind(this));
    },

    autoOperation: function(operationType){
        if (operationType === "bet"){
            this.selfBet("autoBet", this.betWidgetCtrl.getMinBetCount());
        }else if (operationType === "stopCard"){
            let index = this.handCardWidgetCtrlArr[this.getUserChairIndex(this.myChairID)].getCurOperationIndex();
            this.userOperation("stopCard", index);
        }else if (operationType === "ready"){
            Global.DialogManager.addLoadingCircle();
            roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
        }else if (operationType === "insurance"){
            this.selfBuyInsurance(false);
        }
    },

    updateUserStatus: function(chairID, status){
        if (!!status && status !== 'ready') return;
        let index = this.getUserChairIndex(chairID);
        let node = this.userStatusNodeArr[index];
        for(let i = 0; i < node.children.length; ++i){
            node.children[i].active = node.children[i].name === status;
        }
    },

    onGameResult: function (resultData) {
        // 显示庄家的牌
        this.scheduleOnce(function () {
            this.bankerHandCardCtrl.showBankerHandCard(resultData.bankerCardArr, function () {
                this.bankerHandCardCtrl.stopCard(0);
                // 显示输赢分数
                for (let i = 0; i < resultData.scoreChangeArr.length; ++i){
                    let score = resultData.scoreChangeArr[i];
                    if (!!score){
                        let index = this.getUserChairIndex(i);
                        if (score > 0){
                            this.userHeadCtrlArr[index].goldChange(score * (1 - (this.profitPercentage)/100), true);
                            if (i === this.myChairID){
                                Global.AudioManager.playSound('GameCommon/Sound/win_game');
                            }
                        }else{
                            this.userHeadCtrlArr[index].goldChange(score, true);
                        }
                    }
                }
                // 刷新分数
                this.updateUserInfo();
                this.operationWidgetCtrl.stopOperation();
                this.clockWidgetCtrl.stopClock();
                this.betWidgetCtrl.stopBet();
                // 显示准备按钮
                this.readyBtnNode.active = true;
                this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "ready", this.autoOperation.bind(this));
            }.bind(this));
        }.bind(this), 1);
    },

    getUserChairIndex: function (chairID) {
        return (chairID - this.myChairID + 4)%4;
    },
    
    clearState: function () {
        for (let i = 0; i < 4; ++i){
            this.updateUserStatus(i, null);
        }
    },
    
    exitGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this, true);
            Global.CCHelper.releaseRes(['Game/BlackJack']);
        }.bind(this));
    }
});
