let roomProto = require('../../API/RoomProto');
let gameProto = require('./DZProto');
let roomAPI = require('../../API/RoomAPI');
let gameLogic = require('./DZGameLogic');

cc.Class({
    extends: cc.Component,

    properties: {
        userHeadPosNodeArr: [cc.Node],
        userHeadWidgetPrefab: cc.Prefab,

        publicCardWidgetCtrl: require("DZPublicCardWidgetCtrl"),
        handCardPosNodeArr: [cc.Node],
        handCardWidgetPrefab: cc.Prefab,

        operationWidgetCtrl: require("DZOperationWidgetCtrl"),

        userBetCountLabelArr: [cc.Label],
        totalBetCountLabel: cc.Label,
        gameIndexLabel: cc.Label,

        bankerLogoNode: cc.Node,
        bankerLogoPosNodeArr: [cc.Node],

        continueNode: cc.Node,

        goldAnimationRoot: cc.Node,
        youWinNode: cc.Node,

        showWinCardTypeRoot: cc.Node,
        showWinCardTypePrefab: cc.Prefab
    },

    onLoad: function () {
        this.gameInited = false;

        this.myChairID = -1;
        this.gameTypeInfo = null;
        this.curUserChairID = -1;

        this.reMatchGame = false;

        this.totalBetCount = 0;             // 玩家总下注金额

        this.roomUserInfoArr = [];
        this.handCardWidgetCtrlArr = [];
        this.userHeadWidgetCtrlArr = [];
        for (let i = 0; i < 9; ++i){
            this.roomUserInfoArr.push(null);
            // 创建手牌控制器
            let handCardNode = cc.instantiate(this.handCardWidgetPrefab);
            let handCardCtrl = handCardNode.getComponent("DZHandCardWidgetCtrl");
            this.handCardWidgetCtrlArr.push(handCardCtrl);
            handCardNode.parent = this.handCardPosNodeArr[i];
            // 创建用户头像控制器
            let userHeadNode = cc.instantiate(this.userHeadWidgetPrefab);
            let userHeadCtrl = userHeadNode.getComponent("DZUserHeadWidgetCtrl");
            this.userHeadWidgetCtrlArr.push(userHeadCtrl);
            userHeadNode.parent = this.userHeadPosNodeArr[i];
        }


        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        
        // 获取场景
        this.scheduleOnce(function () {
            roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
        }, 0.2);

        // 播放背景音乐
        // Global.AudioManager.startPlayBgMusic("Game/DDZ/Sound/sound_bg");
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
                this.gameTypeInfo = msg.data.gameTypeInfo;
                this.gameIndexLabel.string = msg.data.drawID;
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
            if (msg.type === gameProto.GAME_START_PUSH){
                // 游戏开始推送
                this.onGameStart(msg.data);
            }else if(msg.type === gameProto.GAME_SEND_CARD_PUSH) {
                this.onGameSendCard(msg.data.cardDataArr, msg.data.nextUserChairID, msg.data.curBetCount, msg.data.maxBetCount, msg.data.totalBetCount);
            } else if(msg.type === gameProto.GAME_USER_BET_PUSH) {
                this.onUserBet(msg.data.chairID, msg.data.count, msg.data.curTurnTotalBetCount, msg.data.nextUserChairID, msg.data.curBetCount, msg.data.maxBetCount, msg.data.operationType);
            } else if (msg.type === gameProto.GAME_USER_GIVE_UP_PUSH){
                this.onUserGiveUp(msg.data.chairID, msg.data.nextUserChairID, msg.data.curBetCount, msg.data.maxBetCount)
            } else if(msg.type === gameProto.GAME_END_PUSH){
                this.onGameResult(msg.data);
            } else if (msg.type === gameProto.GAME_USER_UPDATE_TAKE_GOLD_PUSH){
                this.updateTakeGold(msg.data.chairID, msg.data.takeGold);
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
        if (parameter === 'continue'){
            if (Global.Player.isInRoom()){
                this.reMatchGame = true;
                Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Global.DialogManager.addLoadingCircle();
                return;
            }

            Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: this.gameTypeInfo.gameTypeID});
            /*roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));*/
        } else if (parameter === 'exit'){
            Global.DialogManager.addPopDialog('确认退出游戏?', function() {
                if (Global.Player.getPy('roomID')){
                    roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
                    Global.DialogManager.addLoadingCircle();
                }else{
                    this.exitGame();
                }
            }.bind(this), function() {});
        } else if (parameter === 'settings'){
            Global.DialogManager.createDialog('Setting/SettingDialog');
        } else if (parameter === 'rule'){
            Global.DialogManager.createDialog("Game/DeZhouPoker/RoomLayer/DZGameRuleDialog");
        }
    },

    gameInit: function (roomUserInfoArr, gameData) {
        this.gameInited = true;
        // 获取自己的位置
        for (let i = 0; i < roomUserInfoArr.length; ++i){
            let roomUserInfo = roomUserInfoArr[i];
            if (roomUserInfo.userInfo.uid === Global.Player.getPy('uid')){
                this.myChairID = roomUserInfo.chairId;
                break;
            }
        }
        // 设置用户信息
        this.roomUserInfoArr = [null, null, null, null, null, null, null, null, null];
        for (let i = 0; i < roomUserInfoArr.length; ++i){
            this.onUserEntryRoom(roomUserInfoArr[i]);
        }
        for (let i = 0; i < this.roomUserInfoArr.length; ++i){
            if (!!this.roomUserInfoArr[i]) continue;
            let index = this.getUserChairIndex(i);
            this.userHeadWidgetCtrlArr[index].resetWidget();
        }
        // 记录抽水比例
        this.profitPercentage = gameData.profitPercentage;
        // 未开局状态
        if(gameData.gameStatus === gameProto.gameStatus.NONE){
            // 设置总下注金额为0
            this.totalBetCount = 0;
            this.totalBetCountLabel.string = Global.Utils.formatNumberToString(this.totalBetCount, 2);
            // 发送准备消息
            Global.API.room.roomMessageNotify(roomProto.userReadyNotify(true));
        } else if (gameData.gameStatus === gameProto.gameStatus.PLAYING){
            // 设置公共牌
            this.publicCardWidgetCtrl.sendCard(gameData.showPublicCardArr, false);
            // 设置信息
            let totalBetCount = 0;
            for(let i = 0; i < gameData.userStatusArr.length; ++i){
                let index = this.getUserChairIndex(i);
                // 设置手牌
                if (i === this.myChairID){
                    this.handCardWidgetCtrlArr[index].sendCard(gameData.selfCardArr, gameData.userStatusArr[i], -1);
                }else{
                    this.handCardWidgetCtrlArr[index].sendCard(null, gameData.userStatusArr[i], -1);
                }
                // 设置下注金额
                this.userBetCountLabelArr[index].string = Global.Utils.formatNumberToString(gameData.curTurnBetCountArr[i], 2);
                if (gameData.userStatusArr[i] === gameProto.userStatus.PLAYING){
                    this.userBetCountLabelArr[index].node.parent.active = true;
                }
                // 计算奖池总金币
                totalBetCount += (gameData.totalBetCountArr[i] - gameData.curTurnBetCountArr[i]);
                // 修正用户金币
                this.userHeadWidgetCtrlArr[index].addGold(-gameData.totalBetCountArr[i]);
                // 设置用户状态
                this.userHeadWidgetCtrlArr[index].setStatus(gameData.userStatusArr[i]);
            }
            // 设置总下注金额
            this.totalBetCount = totalBetCount;
            this.totalBetCountLabel.string = Global.Utils.formatNumberToString(totalBetCount, 2);
            // 设置庄家标识
            let bankerIndex = this.getUserChairIndex(gameData.bankerUserChairID);
            this.bankerLogoNode.active = true;
            this.bankerLogoNode.position = this.bankerLogoPosNodeArr[bankerIndex];
            // 设置当前操作用户
            this.curUserChairID = gameData.currentUserChairID;
            if (gameData.currentUserChairID >= 0) this.startNextUserOperation(gameData.currentUserChairID, gameData.curTurnBetCountArr[gameData.currentUserChairID], gameData.curTurnMaxBetCount);
        }
    },

    resetGame: function () {
        // 清除手牌
        for (let i = 0; i < this.handCardWidgetCtrlArr.length; ++i){
            this.handCardWidgetCtrlArr[i].resetWidget();
        }
        // 清除公共牌
        this.publicCardWidgetCtrl.resetWidget();
        // 清楚用户头像
        for (let i = 0; i < this.userHeadWidgetCtrlArr.length; ++i){
            this.userHeadWidgetCtrlArr[i].clearWidget();
        }
        // 清除庄家标识
        this.bankerLogoNode.active = false;
        // 清除按钮
        this.operationWidgetCtrl.resetWidget();
        // 清除赢牌显示
        this.showWinCardTypeRoot.removeAllChildren(true);
        // 清除你赢了动画
        this.youWinNode.stopAllActions();
        this.youWinNode.active = false;
        // 清除所有金币动画
        this.goldAnimationRoot.removeAllChildren(true);
        // 清除玩家下注金额
        for (let i = 0; i < this.userBetCountLabelArr.length; ++i){
            this.userBetCountLabelArr[i].string = "0";
            this.userBetCountLabelArr[i].node.parent.active = false;
        }
        // 清除总下注金额
        this.totalBetCountLabel.string = "0";
        // 隐藏准备按钮
        this.continueNode.active = false;
    },

    onReconnection: function () {
        this.resetGame();
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },
    
    onUserEntryRoom: function (roomUserInfo) {
        // 设置用户角色、昵称、金币
        let index = this.getUserChairIndex(roomUserInfo.chairId);
        this.userHeadWidgetCtrlArr[index].initWidget(roomUserInfo.userInfo);
        this.roomUserInfoArr[roomUserInfo.chairId] = roomUserInfo;
    },

    onUserLeaveRoom: function (roomUserInfo) {
        // 删除用户信息
        if(roomUserInfo.chairId === this.myChairID){
            Global.DialogManager.removeLoadingCircle();
            if (this.reMatchGame){
                this.reMatchGame = false;
                Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: this.gameTypeInfo.gameTypeID});
            }else{
                this.exitGame();
            }
        }else{
            let index = this.getUserChairIndex(roomUserInfo.chairId);
            // 删除头像信息
            this.userHeadWidgetCtrlArr[index].resetWidget();
            // 删除牌信息
            this.handCardWidgetCtrlArr[index].resetWidget();
            // 删除记录信息
            this.roomUserInfoArr[roomUserInfo.chairId] = null;
        }
    },

    updateUserInfo: function () {
        for (let i = 0; i < this.roomUserInfoArr.length; ++i){
            let roomUserInfo = this.roomUserInfoArr[i];
            if (!roomUserInfo) continue;
            let index = this.getUserChairIndex(i);
            this.userHeadWidgetCtrlArr[index].updateGold(roomUserInfo.userInfo.takeGold);
        }
    },

    updateTakeGold: function (chairID, takeGold) {
        let index = this.getUserChairIndex(chairID);
        this.userHeadWidgetCtrlArr[index].updateGold(takeGold);

        if (chairID === this.myChairID){
            Global.DialogManager.addTipDialog("带入金币不足，已自动补充");
        }
    },
    
    onUserReady: function (chairID) {
        // 显示准备状态
        // let index = this.getUserChairIndex(chairID);
        // this.showTipNodeArr[index].getChildByName('ready').active = true;
    },
    
    onGameStart: function (data) {
        // 设置牌局编号
        this.gameIndexLabel.string = "牌局编号:" + data.drawID;

        let bankerIndex = this.getUserChairIndex(data.bankerUserChairID);
        // 设置庄家表示
        this.bankerLogoNode.active = true;
        this.bankerLogoNode.position = this.bankerLogoPosNodeArr[bankerIndex].position;
        // 设置初始下注
        for (let i = 0; i < this.userBetCountLabelArr.length; ++i){
            if (data.userStatusArr[i] === gameProto.userStatus.NONE) continue;
            let index = this.getUserChairIndex(i);
            let startPos = this.userHeadWidgetCtrlArr[i].getCenterPos();
            let endPos = this.userBetCountLabelArr[i].node.parent.convertToWorldSpaceAR(this.userBetCountLabelArr[i].node.position);
            this.playGoldAnimation(startPos, endPos, true, function () {
                let label = this.userBetCountLabelArr[index];
                label.node.parent.active = true;
                label.string = Global.Utils.formatNumberToString(data.betCountArr[i], 2);
            }.bind(this));
        }
        // 更新用户金币
        for (let i = 0; i < this.userHeadWidgetCtrlArr.length; ++i){
            if (data.userStatusArr[i] === gameProto.userStatus.NONE) continue;
            let index = this.getUserChairIndex(i);
            this.userHeadWidgetCtrlArr[index].addGold(-data.betCountArr[i], false);
        }
        // 设置玩家手牌
        let handCtrlIndex = 0;
        for (let i = 0; i < this.handCardWidgetCtrlArr.length; ++i){
            if (data.userStatusArr[i] === gameProto.userStatus.NONE) continue;
            if (i === this.myChairID){
                let selfIndex = this.getUserChairIndex(this.myChairID);
                this.handCardWidgetCtrlArr[selfIndex].sendCard(data.selfCardArr, data.userStatusArr[this.myChairID], handCtrlIndex++);
            }else{
                let index = this.getUserChairIndex(i);
                this.handCardWidgetCtrlArr[index].sendCard(null, data.userStatusArr[i], handCtrlIndex++);
            }
        }
        // 设置先手玩家倒计时
        this.curUserChairID = data.nextUserChairID;
        this.startNextUserOperation(data.nextUserChairID, data.betCountArr[data.nextUserChairID], data.maxBetCount, 0);
    },

    onGameSendCard: function (cardDataArr, nextUserChairID, curBetCount, maxBetCount, totalBetCount) {
        this.curUserChairID = nextUserChairID;
        // 播放总奖池变化动画，更新奖池金额
        this.totalBetCount = totalBetCount;
        let endPos = this.totalBetCountLabel.node.parent.convertToWorldSpaceAR(this.totalBetCountLabel.node.position);
        let isSetCallback = false;
        for (let i = 0; i < this.userBetCountLabelArr.length; ++i){
            if (!this.userBetCountLabelArr[i].node.parent.active) continue;
            let count = parseFloat(this.userBetCountLabelArr[i].string);
            if (count <= 0) continue;
            this.userBetCountLabelArr[i].string = "0";
            let startPos = this.userBetCountLabelArr[i].node.parent.convertToWorldSpaceAR(this.userBetCountLabelArr[i].node.position);
            if (!isSetCallback){
                isSetCallback = true;
                this.playGoldAnimation(startPos, endPos, false, function () {
                    this.totalBetCountLabel.string = Global.Utils.formatNumberToString(totalBetCount, 2);

                    // 显示发送的扑克牌
                    this.publicCardWidgetCtrl.sendCard(cardDataArr, true, function () {
                        // 清楚上一轮用户的状态
                        for (let i = 0; i < this.userHeadWidgetCtrlArr.length; ++i){
                            if (!!this.userHeadWidgetCtrlArr[i].node.active){
                                this.userHeadWidgetCtrlArr[i].setOperation(gameProto.operationType.NONE);
                            }
                        }
                        // 显示自己是牌类型
                        let index = this.getUserChairIndex(this.myChairID);
                        let maxCardDataArr = this.handCardWidgetCtrlArr[index].updatePublicCard(cardDataArr);
                        // 设置牌高亮
                        let keyCardData = gameLogic.getKeyCardArr(maxCardDataArr);
                        this.publicCardWidgetCtrl.setCardDataArrLight(keyCardData, false);
                        // 设置自己的牌高亮
                        this.handCardWidgetCtrlArr[index].setCardDataArrLight(keyCardData);
                        // 开始下一轮
                        if (nextUserChairID >= 0)this.startNextUserOperation(nextUserChairID, curBetCount, maxBetCount);
                    }.bind(this));
                }.bind(this));
            }else{
                this.playGoldAnimation(startPos, endPos, false);
            }
        }
        // 如果没有金币动画则直接执行回调内容
        if (!isSetCallback){
            // 显示发送的扑克牌
            this.publicCardWidgetCtrl.sendCard(cardDataArr, true, function () {
                // 清除上一轮用户的状态
                for (let i = 0; i < this.userHeadWidgetCtrlArr.length; ++i){
                    if (!!this.userHeadWidgetCtrlArr[i].node.active){
                        this.userHeadWidgetCtrlArr[i].setOperation(gameProto.operationType.NONE);
                    }
                }
                // 显示自己是牌类型
                let index = this.getUserChairIndex(this.myChairID);
                let maxCardDataArr = this.handCardWidgetCtrlArr[index].updatePublicCard(cardDataArr);
                // 设置牌高亮
                let keyCardData = gameLogic.getKeyCardArr(maxCardDataArr);
                this.publicCardWidgetCtrl.setCardDataArrLight(keyCardData, false);
                // 设置自己的牌高亮
                this.handCardWidgetCtrlArr[index].setCardDataArrLight(keyCardData);
                // 开始下一轮
                if (nextUserChairID >= 0)this.startNextUserOperation(nextUserChairID, curBetCount, maxBetCount);
            }.bind(this));
        }
    },

    onSelfBet: function (betCount, operationType) {
        // 停止定时器
        let selfIndex = this.getUserChairIndex(this.myChairID);
        let headCtrl = this.userHeadWidgetCtrlArr[selfIndex];
        headCtrl.stopClock();
        // 隐藏按钮
        this.operationWidgetCtrl.node.active = false;
        // 修改下注金币
        // 全押
        if (betCount === -1){
            headCtrl.updateGold(0);

            operationType = gameProto.operationType.ALL_IN;
        }else{
            headCtrl.addGold(-betCount);
            if (betCount === 0){
                operationType = gameProto.operationType.PASS;
            }
        }
        this.userHeadWidgetCtrlArr[selfIndex].setOperation(operationType);
        // 发送下注消息
        Global.API.room.gameMessageNotify(gameProto.gameUserBetNotify(betCount));
    },

    onUserBet: function (chairID, count, curTurnTotalBetCount, nextUserChairID, nextBetCount, maxBetCount, operationType) {
        // 显示下注金额
        let index = this.getUserChairIndex(chairID);
        if (chairID !== this.myChairID){
            // 停止定时器
            this.userHeadWidgetCtrlArr[index].stopClock();
            // 修改金币
            this.userHeadWidgetCtrlArr[index].addGold(-count, false);
            // 设置玩家操作类型
            this.userHeadWidgetCtrlArr[index].setOperation(operationType);
        }
        // 播放下注金币动画，修改下注金币
        let endPos = this.userBetCountLabelArr[index].node.parent.convertToWorldSpaceAR(this.userBetCountLabelArr[index].node.position);
        this.userBetCountLabelArr[index].string = Global.Utils.formatNumberToString(curTurnTotalBetCount, 2);
        if (count > 0) this.playGoldAnimation(this.userHeadWidgetCtrlArr[index].getCenterPos(), endPos, true);
        this.curUserChairID = nextUserChairID;
        if (nextUserChairID >= 0) this.startNextUserOperation(nextUserChairID, nextBetCount, maxBetCount);
    },

    onSelfGiveUp: function () {
        // 停止定时器
        let selfIndex = this.getUserChairIndex(this.myChairID);
        let headCtrl = this.userHeadWidgetCtrlArr[selfIndex];
        headCtrl.stopClock();
        // 更新操作按钮
        this.operationWidgetCtrl.node.active = false;
        // 更新头像状态
        this.userHeadWidgetCtrlArr[selfIndex].setStatus(gameProto.userStatus.GIVE_UP);
        // 设置玩家操作类型
        this.userHeadWidgetCtrlArr[selfIndex].setOperation(gameProto.operationType.GIVE_UP);
        // 更新手牌状态
        this.handCardWidgetCtrlArr[selfIndex].giveUp(true);
        // 发送弃牌消息
        Global.API.room.gameMessageNotify(gameProto.gameUserGiveUpNotify());
    },

    onUserGiveUp: function (chairID, nextUserChairID, curBetCount, curMaxBetCount) {
        if(chairID !== this.myChairID){
            // 停止定时器
            let index = this.getUserChairIndex(chairID);
            let headCtrl = this.userHeadWidgetCtrlArr[index];
            headCtrl.stopClock();
            // 更新头像状态
            this.userHeadWidgetCtrlArr[index].setStatus(gameProto.userStatus.GIVE_UP);
            this.userHeadWidgetCtrlArr[index].setOperation(gameProto.operationType.GIVE_UP);
            // 更新手牌状态
            this.handCardWidgetCtrlArr[index].giveUp(false);
        }else{
            // 如果是自己弃牌，则显示匹配按钮
            this.continueNode.active = true;
        }
        // 开始下一个玩家操作
        this.curUserChairID = nextUserChairID;
        if (nextUserChairID >= 0) this.startNextUserOperation(nextUserChairID, curBetCount, curMaxBetCount);
    },
    
    onGameResult: function (resultData) {
        // 隐藏操作按钮
        this.operationWidgetCtrl.node.active = false;

        let totalBetCount = resultData.totalBetCount;
        let self = this;
        // 如果有下注金币，则将下注区金币放入奖池中
        let moveBetCountFunc = function (resolve) {
            let endPos = self.totalBetCountLabel.node.parent.convertToWorldSpaceAR(self.totalBetCountLabel.node.position);
            let isSetCallback = false;
            for (let i = 0; i < self.userBetCountLabelArr.length; ++i) {
                if (!self.userBetCountLabelArr[i].node.parent.active) continue;
                let count = parseFloat(self.userBetCountLabelArr[i].string);
                if (count <= 0) continue;
                self.userBetCountLabelArr[i].string = "0";
                let startPos = self.userBetCountLabelArr[i].node.parent.convertToWorldSpaceAR(self.userBetCountLabelArr[i].node.position);
                if (!isSetCallback) {
                    isSetCallback = true;
                    self.playGoldAnimation(startPos, endPos, false, function () {
                        self.totalBetCountLabel.string = Global.Utils.formatNumberToString(totalBetCount, 2);
                        resolve();
                    }.bind(self));
                } else {
                    self.playGoldAnimation(startPos, endPos, false);
                }
            }
            // 如果没有金币动画则直接执行回调内容
            if (!isSetCallback) {
                resolve();
            }
        };
        // 发送剩余的扑克牌
        let sendPublicCardFunc = function () {
            return new Promise(function (resolve) {
                self.publicCardWidgetCtrl.sendCard(resultData.showPublicCardArr, true, function () {
                    resolve();
                })
            });
        };
        // 显示所有玩家的牌
        let showWinUserCardFunc = function () {
            return new Promise(resolve=>{
                if (resultData.winType === gameProto.winType.ONLY_ONE){
                    resolve();
                } else{
                    // 显示所有赢牌玩家的牌
                    for (let i = 0; i < resultData.allUserCardArr.length; ++i){
                        let cardArr = resultData.allUserCardArr[i];
                        if (!cardArr || cardArr.length === 0) continue;
                        let index = self.getUserChairIndex(i);
                        if (resultData.winChairIDArr.indexOf(i) !== -1){
                            self.handCardWidgetCtrlArr[index].node.active = false;
                            // 设置赢牌玩家牌高亮
                            let maxCardDataArr = gameLogic.fiveFromSeven(resultData.allUserCardArr[i], resultData.showPublicCardArr);
                            self.publicCardWidgetCtrl.setCardDataArrLight(maxCardDataArr, true);
                            self.handCardWidgetCtrlArr[index].setCardDataArrLight([]);
                            self.showWinUserCard(i, resultData.allUserCardArr[i], resultData.showPublicCardArr, maxCardDataArr);
                        }else{
                            self.handCardWidgetCtrlArr[index].showCard(resultData.allUserCardArr[i]);
                            // 取消牌的高亮
                            self.handCardWidgetCtrlArr[index].setCardDataArrLight([]);
                        }
                    }
                    self.scheduleOnce(function () {
                        resolve();
                    }, 1);
                }
            });
        };
        let sendWinGoldFunc = function () {
            return new Promise(resolve=>{
                self.totalBetCountLabel.string = "0";
                let goldStartPos = self.totalBetCountLabel.node.parent.convertToWorldSpaceAR(self.totalBetCountLabel.node.position);
                let isSetCallBack = false;
                for (let i = 0; i < resultData.scoreChangeArr.length; ++i){
                    if (resultData.scoreChangeArr[i] <= 0) continue;
                    let index = self.getUserChairIndex(i);
                    self.playGoldAnimation(goldStartPos, self.userHeadWidgetCtrlArr[index].getCenterPos(), false, isSetCallBack?null: function () {
                        // 显示金币变化
                        for(let j = 0; j < resultData.scoreChangeArr.length; ++j){
                            let scoreChange = resultData.scoreChangeArr[j];
                            if (scoreChange === 0) continue;
                            let index = self.getUserChairIndex(j);
                            self.userHeadWidgetCtrlArr[index].addGold(scoreChange, true);
                        }
                        // 更新最终金币数
                        self.updateUserInfo();

                        // 延迟显示准备按钮
                        self.scheduleOnce(function () {
                            self.continueNode.active = true;
                        }.bind(this), 3);

                        resolve();
                    });
                    isSetCallBack = true;
                    // 如果自己赢了则播放，你赢了的动画
                    if (i === self.myChairID  && resultData.winChairIDArr.indexOf(self.myChairID) !== -1){
                        self.playSelfWinAnimation();
                    }
                }
            });
        };

        new Promise(moveBetCountFunc).then(sendPublicCardFunc).then(showWinUserCardFunc).then(sendWinGoldFunc).catch(e=>{
            console.error(e);
        })
    },

    startNextUserOperation:function (chairID, curBetCount, maxBetCount) {
        if (this.curUserChairID !== chairID) return;
        // 开启倒计时
        let index = this.getUserChairIndex(chairID);
        let callback = null;
        if (chairID === this.myChairID){
            // 判断超时时自动过牌，还是自动弃牌
            if (curBetCount === maxBetCount){
                callback = this.onSelfBet.bind(this);
            }else{
                callback = this.onSelfGiveUp.bind(this);
            }
        }
        this.userHeadWidgetCtrlArr[index].startClock(gameProto.OPERATION_TIME, callback);
        // 如果是自己操作，更新按钮
        if (chairID === this.myChairID){
            let parameter = JSON.parse(this.gameTypeInfo.parameters|| "{}");
            let bindBetCount = parameter["blindBetCount"];
            // 获取总下注金额
            this.operationWidgetCtrl.updateWidget(true, curBetCount, maxBetCount, this.userHeadWidgetCtrlArr[index].getGold(), bindBetCount*2, this.totalBetCount, this.selfOperationCallback.bind(this));
        }else if (chairID >= 0){
            this.operationWidgetCtrl.updateWidget(false);
        }
    },

    selfOperationCallback: function (operationType, count) {
        if (operationType === "flow"){
            this.onSelfBet(count, gameProto.operationType.FLOW);
        } else if (operationType === "addBet"){
            this.onSelfBet(count, gameProto.operationType.ADD_BET);
        } else if (operationType === "pass"){
            this.onSelfBet(0);
        } else if (operationType === "giveup"){
            this.onSelfGiveUp();
        }
    },

    getUserChairIndex: function (chairID) {
        return (chairID - this.myChairID + 9)%9;
    },

    exitGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this, true);
            Global.CCHelper.releaseRes(['Game/DeZhouPoker']);
        }.bind(this));
    },

    showWinUserCard: function (chairID, cardDataArr, publicCardDataArr, maxCardDataArr) {
        this.showWinCardTypeRoot.removeAllChildren(true);

        let node = cc.instantiate(this.showWinCardTypePrefab);
        let index = this.getUserChairIndex(chairID);
        node.position = this.showWinCardTypeRoot.convertToNodeSpaceAR(this.userHeadWidgetCtrlArr[index].getCenterPos());
        node.parent = this.showWinCardTypeRoot;

        let sprite0 = node.getChildByName("card0").getComponent(cc.Sprite);
        let sprite1 = node.getChildByName("card1").getComponent(cc.Sprite);

        let light0 = node.getChildByName("light0");
        let light1 = node.getChildByName("light1");

        Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", sprite0);
        Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", sprite1);

        sprite0.node.stopAllActions();
        sprite1.node.stopAllActions();

        let cardType = gameLogic.getCardType(gameLogic.fiveFromSeven(cardDataArr, publicCardDataArr));
        let winCardTypeNode = node.getChildByName("winCardType");
        Global.CCHelper.updateSpriteFrame("Game/DeZhouPoker/win_card_type_" + cardType, winCardTypeNode.getComponent(cc.Sprite));
        winCardTypeNode.active = false;

        sprite0.node.runAction(cc.sequence([cc.scaleTo(0.2, 0.01, 1), cc.callFunc(function () {
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + cardDataArr[0], sprite0);
        }.bind(this)), cc.scaleTo(0.1, 1, 1)]));

        sprite1.node.runAction(cc.sequence([cc.scaleTo(0.2, 0.01, 1), cc.callFunc(function () {
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + cardDataArr[1], sprite1);
        }.bind(this)), cc.scaleTo(0.1, 1, 1), cc.callFunc(function () {
            winCardTypeNode.active = true;
            if (maxCardDataArr.indexOf(cardDataArr[0]) !== -1){
                light0.active = true;
            }
            if (maxCardDataArr.indexOf(cardDataArr[1]) !== -1){
                light1.active = true;
            }
        }.bind(this))]));
    },

    playGoldAnimation: function (startPos, targetPos, isUserBet, cb) {
        startPos = this.goldAnimationRoot.convertToNodeSpaceAR(startPos);
        targetPos = this.goldAnimationRoot.convertToNodeSpaceAR(targetPos);
        let node = Global.CCHelper.createSpriteNode("Game/DeZhouPoker/img_chip");
        node.parent = this.goldAnimationRoot;
        node.position = startPos;
        node.runAction(cc.sequence([cc.moveTo(isUserBet?0.2: 0.5, targetPos), cc.callFunc(function () {
            Global.Utils.invokeCallback(cb);
        }.bind(this)), cc.removeSelf()]));
    },

    playSelfWinAnimation: function () {
        this.youWinNode.stopAllActions();
        this.youWinNode.active = true;
        this.youWinNode.scale = 0.01;
        let action = cc.scaleTo(0.3, 1);
        action.easing(cc.easeBackOut());
        this.youWinNode.runAction(cc.sequence([cc.show(), action, cc.delayTime(2), cc.hide()]));
    }
});
