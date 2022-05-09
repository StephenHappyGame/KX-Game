let gameProto = require('./GameProtoZJH');
let roomProto = require('../../API/RoomProto');
let roomAPI = require('../../API/RoomAPI');
let ZJHAudio = require('./ZJHAudio');

cc.Class({
    extends: cc.Component,

    properties: {
        chairPos: [cc.Node],

        chairPrefab: cc.Prefab,
        cardsPrefab: cc.Prefab,
        selectChairPrefab: cc.Prefab,
        addStakePrefab: cc.Prefab,
        comparePrefab: cc.Prefab,

        chipPool: require('ZJHChipPool'),
        operationWidgetCtrl: require('ZJHOperation'),
        addStakeWidgetCtrl: require('ZJHAddStake'),
        selectChairWidgetCtrl: require('ZJHSelectChair'),

        continueNode: cc.Node
    },

    // use this for initialization
    onLoad: function () {
        Global.AudioManager.startPlayBgMusic("Game/ZhaJinHua/audio/zjh_bg");

        //服务器推送消息
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);

        this.myChairID = -1;
        this.gameTypeInfo = null;
        this.profitPercentage = 0;
        this.giveUping = false;
        this.roomUserInfoArr = [null, null, null, null, null];
        this.chairCtrlArr = [null, null, null, null, null];
        this.cardCtrlArr = [null, null, null, null, null];
        this.gameInited = false;

        this.reMatchGame = false;

        this.operationWidgetCtrl.setEventCallback(this.onBtnClk.bind(this));

        // 获取场景数据
        this.scheduleOnce(function () {
            roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
        }, 0.2);
    },

    onDestroy: function () {
        //移除事件监听
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'dissRoom':
                if (!this.gameInited) return;
                this.leaveRoom();
                break;
            case 'roomRule':
                Global.DialogManager.createDialog("GameCommon/GameRule/GameRuleDialog", {kind: Global.Enum.gameType.ZJH});
                break;
            case 'setting':
                Global.DialogManager.createDialog('Setting/SettingDialog');
                break;
            case 'continue':
                if (Global.Player.isInRoom()){
                    this.reMatchGame = true;
                    Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
                    Global.DialogManager.addLoadingCircle();
                    return;
                }
                Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: this.gameTypeInfo.gameTypeID});
                break;
            case 'lookCard':
                if (this.chairCtrlArr[0].isLookedCard()){
                    Global.DialogManager.addTipDialog("已经看牌，无法重复看牌");
                    return;
                }
                ZJHAudio.kanPai();
                roomAPI.gameMessageNotify(gameProto.userLookCardNotify());
                break;
            case 'giveUp':
                ZJHAudio.giveUp();
                roomAPI.gameMessageNotify(gameProto.userGiveUpNotify());
                //this.operationWidgetCtrl.showNormalOperationUI();
                this.operationWidgetCtrl.node.active = false;
                break;
            case 'stake':
                // 若金钱不足以下注，则孤注一掷和下家比牌，赢了继续比牌，输了直接GG
                let currentStakeLevel = this.operationWidgetCtrl.currentStakeLevel;
                let currentMultiple = this.operationWidgetCtrl.currentMultiple;
                if (Global.Player.gold <= gameProto.STAKE_LEVEL[currentStakeLevel] * currentMultiple) {
                    roomAPI.gameMessageNotify(gameProto.guzhuyizhiNotify(Global.Player.gold));
                    return;
                }
                ZJHAudio.genZhu();
                roomAPI.gameMessageNotify(gameProto.userStakeNotify(currentStakeLevel));
                break;
            case 'addStake':
                if(!this.addStakeWidgetCtrl.node.active) {
                    this.addStakeWidgetCtrl.node.active = true;
                    let currentStakeLevel = this.operationWidgetCtrl.currentStakeLevel;
                    let currentMultiple = this.operationWidgetCtrl.currentMultiple;
                    this.addStakeWidgetCtrl.startSelectStake(currentStakeLevel, currentMultiple, this.onSelfStake.bind(this));
                } else {
                    this.addStakeWidgetCtrl.node.active = false;
                }
                break;
            case 'autoStake':
                this.autoStake = !this.autoStake;
                if (this.autoStake) {
                    this.operationWidgetCtrl.showAutoEff();
                } else {
                    this.operationWidgetCtrl.hideAutoEff();
                }
                break;
            case 'compare':
                if (this.selectChairWidgetCtrl.node.active) return;
                this.selectChairWidgetCtrl.node.active = true;
                // 查询当前正在玩的玩家
                let currentPlayerUserChairID = [];
                let isCanCompare = false;
                for (let i = 0; i < 5; ++i) {
                    if (i === this.myChairID) continue;
                    let index = this.getUserChairIndex(i);
                    let ctrl = this.chairCtrlArr[index];
                    if(!ctrl) continue;
                    if (ctrl.canCompare()) {
                        this.selectChairWidgetCtrl.addSelectEff(index, this.chairPos[index].position, i, function (chairId) {
                            this.selectChairWidgetCtrl.clearWidget();
                            roomAPI.gameMessageNotify(gameProto.userCompareNotify(chairId));
                            this.operationWidgetCtrl.node.active = false;
                        }.bind(this));

                        isCanCompare = true;
                    }
                    if (ctrl.isPlayingGame()) {
                        currentPlayerUserChairID.push(i);
                    }
                }
                //如果只剩下两个人，则随时可以比牌
                if (currentPlayerUserChairID.length === 1) {
                    for (let i = 0; i < currentPlayerUserChairID.length; i ++) {
                        if (currentPlayerUserChairID[i] !== this.myChairID) {
                            let index = this.getUserChairIndex(currentPlayerUserChairID[i]);
                            this.selectChairWidgetCtrl.addSelectEff(index, this.chairPos[index].position, currentPlayerUserChairID[i], function (chairId) {
                                this.selectChairWidgetCtrl.clearWidget();
                                roomAPI.gameMessageNotify(gameProto.userCompareNotify(chairId));
                                this.operationWidgetCtrl.node.active = false;
                            }.bind(this));
                            isCanCompare = true;
                        }
                    }
                }
                // 显示比牌选择组件
                if (isCanCompare){
                    // 隐藏加注按钮
                    this.addStakeWidgetCtrl.node.active = false;
                }else{
                    this.selectChairWidgetCtrl.node.active = false;
                    Global.DialogManager.addTipDialog("玩家人数超过两人，只能跟已看牌的玩家比牌");
                }
                break;
            case 'endCompare':
                this.selectChairWidgetCtrl.clearWidget();
                break;
        }
    },

    messageCallbackHandler: function (route, msg) {
        if(route === 'RoomMessagePush') {
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
        } else if (route === 'ReConnectSuccess') {
            if(Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(Global.Player.roomID, function() {
                    roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
                }, function () {
                    this.exitGame();
                }.bind(this));
            } else {
                this.exitGame();
            }
        } else if (route === 'GameMessagePush') {
            if (!this.gameInited) return;
            switch (msg.type) {
                case gameProto.GAME_START_PUSH:
                    this.onGameStart(msg.data.stakeLevel, msg.data.firstXiaZhu, msg.data.goldSumAmount, msg.data.round, msg.data.userStakeCountArr);
                    break;
                case gameProto.GAME_OPERATE_STAKE_PUSH:
                    this.onUserStake(msg.data.chairId, msg.data.stakeLevel, msg.data.multiple, msg.data.userStakeCount, msg.data.goldSumAmount, msg.data.round);
                    break;
                case gameProto.GAME_OPERATE_GIVEUP_PUSH:
                    this.onUserGiveUp(msg.data.chairId);
                    break;
                case gameProto.GAME_OPERATE_LOOK_PUSH:
                    this.onUserLookCard(msg.data.chairId, "look", msg.data.cardType, msg.data.cardDataArr);
                    break;
                case gameProto.GAME_OPERATE_COMPARE_PUSH:
                    this.onUserCompare(msg.data.chairId, msg.data.loserchairId, msg.data.comparechairId);
                    break;
                /*case gameProto.GAME_OPERATE_GU_ZHU_YI_ZHI_PUSH:
                    this.showGuzhuyizhiAnimation(msg);
                    break;*/
                case gameProto.GAME_OPERATE_SHOWDOWN_PUSH:
                    this.onUserShowdown();
                    break;
                case gameProto.GAME_CHAIR_TURN_PUSH:
                    this.operationWidgetCtrl.updateStakeLevel(msg.data.currentStakeLevel, msg.data.currentMultiple);
                    if (msg.data.chairId === this.myChairID){
                        this.operationWidgetCtrl.showSpecialOperationUI();
                    }else{
                        if (this.chairCtrlArr[0].isPlayingGame()){
                            this.operationWidgetCtrl.showNormalOperationUI();
                        }
                    }
                    break;
                case gameProto.GAME_END_PUSH:
                    if (this.giveUping) {
                        this.endMsg = msg.data;
                        return;
                    }
                    this.checkCompareEnd(msg.data);
                    break;
            }
        }
    },

    gameInit: function (roomUserInfoArr, gameData) {
        this.gameInited = true;
        this.gameTypeInfo = gameData.gameTypeInfo;
        // 记录抽水比例
        this.profitPercentage = gameData.profitPercentage;
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
        // 未开局状态
        if(gameData.gameStatus === gameProto.gameStatus.NONE){
            roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));
        } else if (gameData.gameStatus === gameProto.gameStatus.PLAYING){
            // 设置当前下注等级
            this.operationWidgetCtrl.updateStakeLevel(gameData.currentStakeLevel);
            for (let i = 0; i < this.chairCtrlArr.length; i++) {
                let index = this.getUserChairIndex(i);
                if (!this.chairCtrlArr[index]) continue;
                let userStatus = gameData.userStatus[i];
                //设置玩家状态
                if (userStatus === gameProto.LOOK_CARD || userStatus === gameProto.GIVE_UP || userStatus === gameProto.LOSE) {
                    this.chairCtrlArr[index].showStatus(userStatus);
                }
                // 如果是自己操作，则显示操作UI
                if (i === this.myChairID) {
                    if (this.myChairID === gameData.currentUserchairId) {
                        this.operationWidgetCtrl.showSpecialOperationUI();
                    } else {
                        this.operationWidgetCtrl.showNormalOperationUI();
                    }
                }
                //设置玩家牌
                if (userStatus !== 0 && userStatus !== gameProto.LEAVE) {
                    //如果自己已经看过牌了，则显示自己的牌，并隐藏点击看牌按钮
                    if (i === this.myChairID && userStatus === gameProto.LOOK_CARD) {
                        this.createCard(index, gameData.userCardsArr, false);
                        this.operationWidgetCtrl.updateStakeLevel(null, 2);
                    } else {
                        this.createCard(index, null, false);
                    }
                } else {
                    //如果自己是刚进来的，则不显示操作界面
                    if (i === this.myChairID) {
                        this.operationWidgetCtrl.node.active = false;
                    }
                }

                //设置玩家分数
                this.chairCtrlArr[index].onUserStake(gameData.userStakeCountArr[i], gameData.userStakeCountArr[i]);
            }
            //设置下注池
            this.chipPool.setChips(gameData.goldSumAmount, gameData.round, gameData.stakeArr);
            this.chipPool.showPoolInfoGroup();
            /*//隐藏准备模块
            this.chairCtrlArr[0].hideReadyGroup();*/
            //设置先手标识
            this.chairCtrlArr[this.getUserChairIndex(gameData.firstXiaZhu)].showFirstXiaZhu();
        }
    },

    resetGame: function () {
        this.node.stopAllActions();
        this.unscheduleAllCallbacks();
        //牌移除
        for(let i = 0; i < this.cardCtrlArr.length; ++i){
            if (!this.cardCtrlArr[i]) continue;
            this.cardCtrlArr[i].node.destroy();
        }
        this.cardCtrlArr = [null, null, null, null, null];
        //座位状态清除
        for (let i = 0; i < this.chairCtrlArr.length; ++i){
            if (!this.chairCtrlArr[i]) continue;
            this.chairCtrlArr[i].node.destroy();
        }
        this.chairCtrlArr = [null, null, null, null, null];
        //移除筹码
        this.chipPool.removeAllChips();
        //隐藏操作器
        this.operationWidgetCtrl.node.active = false;
        //加注组件
        this.addStakeWidgetCtrl.node.active = false;
        //清除比牌组件
        if (this.compareUI){
            this.compareUI.node.destroy();
            this.compareUI = null;
        }
        //清楚选坐组件
        this.selectChairWidgetCtrl.clearWidget();
    },

    onReconnection: function () {
        this.resetGame();
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onUserEntryRoom: function (roomUserInfo) {
        let node = cc.instantiate(this.chairPrefab);
        let index = this.getUserChairIndex(roomUserInfo.chairId);
        node.parent = this.chairPos[index];
        let ctrl = node.getComponent('ZJHChair');
        this.chairCtrlArr[index] = ctrl;
        ctrl.updateUI(roomUserInfo.userInfo, index, this.profitPercentage, this.node);

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
            // 清除座位信息
            let index = this.getUserChairIndex(roomUserInfo.chairId);
            this.chairCtrlArr[index].node.destroy();
            this.chairCtrlArr[index] = null;

            this.roomUserInfoArr[roomUserInfo.chairId] = null;
        }
    },

    onUserReady: function (chairId) {},

    updateUserInfo: function () {
        for (let i = 0; i < 5; ++i){
            let roomUserInfo = this.roomUserInfoArr[i];
            if(!roomUserInfo) continue;
            let index = this.getUserChairIndex(i);
            this.chairCtrlArr[index].updateUserInfo(roomUserInfo.userInfo);
        }
    },

    onGameStart: function (stakeLevel, firstXiaZhu, goldSumAmount, round, userStakeCountArr) {
        // 设置下底注信息
        for (let i = 0; i < 5; i ++) {
            let index = this.getUserChairIndex(i);
            if (!this.chairCtrlArr[index]) continue;
            // 添加下注
            this.chipPool.addChip(stakeLevel, 1, goldSumAmount, round, this.chairCtrlArr[index].node.position);
            // 更新下注信息
            this.chairCtrlArr[index].onUserStake(userStakeCountArr[i], userStakeCountArr[i]);
            ZJHAudio.chip();
        }
        this.chipPool.showPoolInfoGroup();

        //发牌
        this.createCards();

        //设置先手
        this.scheduleOnce(function () {
            // 显示先手玩家
            this.chairCtrlArr[this.getUserChairIndex(firstXiaZhu)].showFirstXiaZhu(firstXiaZhu);
            // 如果先手玩家是自己则，显示操作器
            this.operationWidgetCtrl.node.active = true;
            // 设置下注等级
            this.operationWidgetCtrl.updateStakeLevel(0, 1);
            if (firstXiaZhu === this.myChairID){
                this.operationWidgetCtrl.showSpecialOperationUI();
            }else{
                this.operationWidgetCtrl.showNormalOperationUI();
            }
        }, 1);
    },

    onSelfStake: function (stakeLevel) {
        roomAPI.gameMessageNotify(gameProto.userStakeNotify(stakeLevel));
        this.operationWidgetCtrl.node.active = false;
        this.addStakeWidgetCtrl.node.active = false;
    },

    onUserStake: function (chairId, stakeLevel, multiple, userStakeCount, goldSumAmount, round) {
        let index = this.getUserChairIndex(chairId);
        this.chipPool.addChip(stakeLevel, multiple, goldSumAmount, round, this.chairPos[index].position);

        this.chairCtrlArr[index].onUserStake(gameProto.STAKE_LEVEL[stakeLevel] * multiple, userStakeCount);
    },

    onUserGiveUp: function (chairId) {
        this.giveUping = true;
        // 更新玩家状态
        let index = this.getUserChairIndex(chairId);
        this.chairCtrlArr[index].showStatus(gameProto.GIVE_UP);

        if (!!this.cardCtrlArr[index]) {
            this.cardCtrlArr[index].giveUpCards(chairId === this.myChairID, function () {
                this.giveUping = false;
                if (!!this.endMsg) {
                    // 显示最终结果
                    this.showGameEnd(this.endMsg);
                }else{
                    // 显示重新匹配按钮
                    if (chairId === this.myChairID){
                        this.continueNode.active = true;
                    }
                }
            }.bind(this));
        } else {
            this.scheduleOnce(function () {
                this.cardCtrlArr[index].giveUpCards(chairId === this.myChairID, function () {
                    this.giveUping = false;
                    if (!!this.endMsg) {
                        this.showGameEnd(this.endMsg);
                    } else{
                        // 显示重新匹配按钮
                        if (chairId === this.myChairID){
                            this.continueNode.active = true;
                        }
                    }
                }.bind(this));
            }.bind(this), 0.7);
        }
    },

    onUserLookCard: function (chairId, showType, cardTye, cardDataArr) {
        let index = this.getUserChairIndex(chairId);
        this.chairCtrlArr[index].showStatus(gameProto.LOOK_CARD);
        this.cardCtrlArr[index].showCards(showType, cardTye, cardDataArr);
    },

    onUserCompare: function (chairId, loserchairId, comparechairId) {
        let callback = function () {
            if (loserchairId === this.myChairID) {
                ZJHAudio.compareFailure();
            } else if (chairId === this.myChairID || comparechairId === this.myChairID) {
                ZJHAudio.compareVictory();
            }

            if (!!this.compareUI) {
                this.compareUI.destroy();
                this.compareUI = null;
            }

            //输的人显示输
            let loseIndex = this.getUserChairIndex(loserchairId);
            this.chairCtrlArr[loseIndex].showResult(false, null);
            // 如果自己输了则不能再操作
            if (loserchairId === this.myChairID){
                this.operationWidgetCtrl.node.active = false;
                // 比牌输，显示重新匹配按钮
                this.continueNode.active = true;
            }
            //显示先手和状态信息
            this.chairCtrlArr[this.getUserChairIndex(chairId)].showOther();
            this.chairCtrlArr[this.getUserChairIndex(comparechairId)].showOther();
        }.bind(this);

        //在进行比牌动画时隐藏操作界面
        this.operationWidgetCtrl.node.active = false;

        //隐藏先手和状态信息
        this.chairCtrlArr[this.getUserChairIndex(chairId)].hideOther();
        this.chairCtrlArr[this.getUserChairIndex(comparechairId)].hideOther();

        let compareUI = cc.instantiate(this.comparePrefab);
        compareUI.parent = this.node;
        compareUI.getComponent('ZJHCompare').startCompare(this.chairCtrlArr[this.getUserChairIndex(chairId)], this.chairCtrlArr[this.getUserChairIndex(comparechairId)], callback, loserchairId === chairId);
        this.compareUI = compareUI;
    },
    
    onUserShowdown: function (chairId, cardType, cardDataArr) {
        let index = this.getUserChairIndex(chairId);
        this.chairCtrlArr[index].showCardGroup();
        if (!!this.cardCtrlArr[index]) {
            this.cardCtrlArr[index].showCards('showdown', cardType, cardDataArr);
        }
    },

    createCard: function (index, cardsArr, isTween) {
        // 创建牌组件
        let cards = cc.instantiate(this.cardsPrefab);
        cards.parent = this.chairPos[index];
        cards.zIndex = 1;
        let ctrl = cards.getComponent('ZJHCards');
        // 设置牌的位置
        ctrl.setPos(index, cardsArr, this.chairPos[index].position, isTween);
        // 如果有牌删除之前的牌
        if (!!this.cardCtrlArr[index]) this.cardCtrlArr[index].node.destroy();
        this.cardCtrlArr[index] = ctrl;

        /*if(!!cardsArr){
            this.scheduleOnce(function () {
                ctrl.showCards(cardsArr);
                ctrl.hideAllBtns();
            }.bind(this), 1);
        }*/
        /*this.scheduleOnce(function () {
            // 创建牌组件
            let cards = cc.instantiate(this.cardsPrefab);
            cards.parent = this.chairPos[index];
            cards.zIndex = 1;
            let ctrl = cards.getComponent('ZJHCards');
            // 设置牌的位置
            ctrl.setPos(index, this.chairPos[index].position, noAnim);
            // 如果有牌删除之前的牌
            if (!!this.cardCtrlArr[index]) this.cardCtrlArr[index].node.destroy();
            this.cardCtrlArr[index] = ctrl;

            if(!!cardsArr){
                this.scheduleOnce(function () {
                    ctrl.showCards(cardsArr);
                    ctrl.hideAllBtns();
                }.bind(this), 1);
            }
        }.bind(this), index * 0.1);*/
    },

    createCards: function () {
        for (let i = 0; i < this.chairCtrlArr.length; ++i) {
            let index = this.getUserChairIndex(i);
            let chairCtrl = this.chairCtrlArr[index];
            if (!chairCtrl) continue;
            this.createCard(index, null, true);
        }
    },

    leaveRoom: function () {
        Global.DialogManager.addPopDialog('确认退出游戏?', function() {
            if (Global.Player.getPy('roomID')){
                Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Global.DialogManager.addLoadingCircle();
            }else{
                this.exitGame();
            }
        }.bind(this), function() {});
    },

    exitGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this, true);
            Global.CCHelper.releaseRes(['Game/ZhaJinHua']);
        }.bind(this));
    },

    checkCompareEnd: function (endData) {
        if (!!this.compareUI) {
            this.scheduleOnce(function () {
                this.checkCompareEnd(endData);
            }, 1.5);
        } else {
            this.showGameEnd(endData);
        }
    },

    showGameEnd: function (data) {
        //有牌的人才显示输赢
        for (let i = 0; i < this.chairCtrlArr.length; ++i) {
            let index = this.getUserChairIndex(i);
            if (!this.chairCtrlArr[index]) continue;
            //this.chairCtrlArr[index].showResult(data.winnerchairId === this.myChairID, data.winnerCardType);
            this.chairCtrlArr[index].showGoldChangeEff(data.scoreChangeArr[i]);
        }
        //隐藏下注入息操作界面
        this.operationWidgetCtrl.node.active = false;

        //显示赢家的牌
        let winnerIndex = this.getUserChairIndex(data.winnerchairId);
        this.chairCtrlArr[winnerIndex].showCardGroup(true);
        this.cardCtrlArr[winnerIndex].showCards("showdown", data.userCardTypeArr[data.winnerchairId], data.userCardIndexArr[data.winnerchairId]);

        if (!!this.cardCtrlArr[0]) {
            //显示亮牌操作
            this.cardCtrlArr[0].showShowBtn();
            if (data.winnerchairId === this.myChairID) {
                //赢家是自己，则不展示亮牌
                this.cardCtrlArr[0].hideAllBtns();
            } else {
                //赢家不是自己，显示自己的牌
                this.cardCtrlArr[0].showCards("", data.userCardTypeArr[this.myChairID], data.userCardIndexArr[this.myChairID]);
            }
        }

        //奖池的钱移动到赢家的座位处
        this.chipPool.collectChips(this.chairPos[winnerIndex]);

        //3秒之后再自动准备开始游戏
        this.scheduleOnce(function () {
            // 显示匹配按钮
            this.continueNode.active = true;
        }.bind(this), 3);
    },

    /*showGuzhuyizhiAnimation: function (msg) {
        this.showGuzhuyizhiCompare(msg);

        let sprite = Global.CCHelper.createSpriteNode('resources/Game/ZhaJinHua/UIImg/guzhuyizhi.png');
        sprite.parent = this.node;
        sprite.x = 0;
        sprite.y = 300;
        sprite.scale = 3;
        sprite.opacity = 0;
        sprite.runAction(cc.scaleTo(0.5, 1, 1));
        sprite.runAction(cc.sequence([cc.fadeIn(0.5), cc.delayTime(1), cc.callFunc(function () {
            sprite.parent = null;
            sprite = null;
        })]));
    },

    showGuzhuyizhiCompare: function (msg, showIndex) {
        showIndex = showIndex || 0;
        let showData = msg.data[showIndex];
        let callback = function () {
            if (showData.loserchairId === ZJHModel.getSelfchairId()) {
                ZJHAudio.compareFailure();
            } else if (showData.chairId === ZJHModel.getSelfchairId() || showData.comparechairId === ZJHModel.getSelfchairId()) {
                ZJHAudio.compareVictory();
            }

            if (!!this.compareUI) {
                this.compareUI.destroy();
                this.compareUI = null;
            }

            if (ZJHModel.gameIsPlaying()) {
                this.chairs[ZJHModel.getSelfchairId()].getComponent('ZJHChair').createOperationUI();
            }

            //输的人显示输
            this.chairs[showData.loserchairId].getComponent('ZJHChair').showResult(showData);

            //输的人不能再操作加注
            this.chairs[showData.loserchairId].getComponent('ZJHChair').hideOperationUI();

            if (showData.chairId === ZJHModel.getSelfchairId()) {
                this.chairs[showData.chairId].getComponent('ZJHChair').operation.getComponent('ZJHOperation').showNormalOperationUI();
            }

            //显示先手和状态信息
            this.chairs[showData.chairId].getComponent('ZJHChair').showOther();
            this.chairs[showData.comparechairId].getComponent('ZJHChair').showOther();

            showIndex = showIndex + 1;
            if (!!msg.data[showIndex]) {
                this.showGuzhuyizhiCompare(msg, showIndex);
            }
        }.bind(this);

        //在进行比牌动画时隐藏操作界面
        this.chairs[ZJHModel.getSelfchairId()].getComponent('ZJHChair').hideOperationUI();

        //隐藏先手和状态信息
        this.chairs[showData.chairId].getComponent('ZJHChair').hideOther();
        this.chairs[showData.comparechairId].getComponent('ZJHChair').hideOther();

        let data = {
            chair: this.chairs[showData.chairId],
            compareChair: this.chairs[showData.comparechairId],
            callback: callback,
            loserchairId: showData.loserchairId
        };

        let compareUI = cc.instantiate(this.comparePrefab);
        compareUI.parent = this.node;
        compareUI.getComponent('ZJHCompare').startCompare(data);
        this.compareUI = compareUI;
    },*/

    getUserChairIndex: function (chairID) {
        return (chairID - this.myChairID + 5)%5;
    },
});
