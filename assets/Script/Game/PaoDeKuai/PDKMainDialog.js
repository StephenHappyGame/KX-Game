let roomProto = require('../../API/RoomProto');
let gameProto = require('./PDKProto');
let roomAPI = require('../../API/RoomAPI');
let gameLogic = require('./PDKGameLogic');

cc.Class({
    extends: cc.Component,

    properties: {
        handCardWidgetCtrl: require('PDKHandCradWidgetCtrl'),
        operationBtnWidgetCtrl: require('PDKOperationBtnWdigetCtrl'),
        cardCountLabelArr: [cc.Label],
        showTipNodeArr: [cc.Node],
        showOutCardNodeArr: [cc.Node],
        clockPosNodeArr: [cc.Node],
        alertAnimationNodeArr: [cc.Node],
        showHandCardNode: [cc.Node],
        nicknameLabelArr: [cc.Label],
        goldLabelArr: [cc.Label],
        userIconSpriteArr: [cc.Sprite],
        showOutCardWidgetPrefab: cc.Prefab,
        showHandCardWidgetPrefab: cc.Prefab,
        clockWidgetPrefab: cc.Prefab,

        cardNode: cc.Node,
        shunziAnimationPrefab: cc.Prefab,
        zhandanAnimationPrefab: cc.Prefab,
        animationNode: cc.Node,

        fieldInfoLabel: cc.Label,

        nextWarnTipNode: cc.Node,

        winScoreLabelArr: [cc.Label],
        loseScoreLabelArr: [cc.Label]
    },

    onLoad: function () {
        this.gameInited = false;

        this.myChairID = -1;
        this.roomID = "";
        this.baseScore = 1;

        this.handCardWidgetCtrl.initWidget();

        this.turnCardDataArr = [];

        this.roomUserInfoArr = [null, null, null];


        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        
        // 获取场景
        this.scheduleOnce(function () {
            roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
        }, 0.2);

        //
        Global.AudioManager.startPlayBgMusic("Game/PaoDeKuai/Sound/sound_bg");
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
            if(msg.type === gameProto.GAME_START_PUSH) {
                this.onGameStart(msg.data.curChairID, msg.data.selfCardArr);
            } else if(msg.type === gameProto.GAME_USER_OUT_CARD_PUSH) {
                this.onUserOutCard(msg.data.chairID, msg.data.outCardArr, msg.data.curChairID, msg.data.leftCardCount, msg.data.enablePass);
            } else if(msg.type === gameProto.GAME_USER_PASS_PUSH) {
                this.onUserPass(msg.data.chairID, msg.data.curChairID, msg.data.isNewTurn, msg.data.enablePass);
            } else if(msg.type === gameProto.GAME_RESULT_PUSH){
                this.onGameResult(msg.data);
            } else if (msg.type === gameProto.GAME_USER_BOMB_WIN_PUSH){
                this.onUserBombWin(msg.data.chairID, true);
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
            this.resetGame();
            Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: this.gameTypeInfo.gameTypeID});
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
            // 下家报单，出单排的时候判定
            if (parseInt(this.cardCountLabelArr[1].string) === 1 && selectedCardDataArr.length === 1){
                // 必须出最大牌
                let allCardDataArr = this.handCardWidgetCtrl.getAllCard();
                let outCardLogicValue = gameLogic.getCardLogicValue(selectedCardDataArr[0]);
                for (let i = 0; i < allCardDataArr.length; ++i){
                    if (gameLogic.getCardLogicValue(allCardDataArr[i]) > outCardLogicValue){
                        Global.DialogManager.addTipDialog("下家已经报单，单排必须出最大牌");
                        return;
                    }
                }
            }
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
            Global.DialogManager.createDialog('Setting/SettingDialog');
        } else if (parameter === 'rule'){
            Global.DialogManager.createDialog("GameCommon/GameRule/GameRuleDialog", { kind: Global.Enum.gameType.PDK });
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
        this.fieldInfoLabel.string = "跑得快  " + fieldName + "  底分 " + gameData.baseScore;
        this.gameTypeInfo = gameData.gameTypeInfo;
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
            // 自动发送准备
            Global.API.room.roomMessageNotify(roomProto.userReadyNotify(true));
        } else if (gameData.gameStatus === gameProto.gameStatus.OUT_CARD){
            // 设置手牌
            this.handCardWidgetCtrl.onSendCard(gameData.selfCardArr, false);
            this.handCardWidgetCtrl.startGame();
            // 设置其他玩家手牌数
            for (let i = 0; i < 3; ++i){
                // 设置其他玩家手牌数
                this.updateCardCount(i, gameData.allUserCardCountArr[i]);
                let index = this.getUserChairIndex(i);
                // 设置是否需要显示警告
                if (gameData.allUserCardCountArr[i].length === 1) this.alertAnimationNodeArr[index].active = true;
            }
            // 更新炸弹分数变化
            for (let i = 0; i < gameData.userBombTimes.length; ++i){
                let times = gameData.userBombTimes[i];
                for (let j = 0; j < times; ++j){
                    this.onUserBombWin(i, false);
                }
            }
            // 不是新的一轮则记录上一轮出牌
            this.turnCardDataArr = gameData.turnCardDataArr;
            // 如果是自己出牌，则显示出牌按钮
            if(gameData.curChairID === this.myChairID){
                this.operationBtnWidgetCtrl.startOutCard(gameData.curChairID === gameData.turnWinerChairID, gameData.enablePass);
            }
            // 设置定时器
            this.showClock(gameData.curChairID, gameData.enablePass?3:gameProto.OUT_CARD_TIME, this.autoOutCard.bind(this));
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
        // 隐藏牌数,隐藏警报
        for (let i = 1; i < 3; ++i){
            this.cardCountLabelArr[i].node.parent.active = false;
            this.alertAnimationNodeArr[i].active = false;
        }
        // 清除上轮牌
        this.turnCardDataArr = [];
        // 清楚手牌显示
        for(let i = 0; i < this.showHandCardNode.length; ++i){
            this.showHandCardNode[i].removeAllChildren();
        }
        // 隐藏包赔提示
        this.nextWarnTipNode.active = false;
        // 清除发牌动画
        this.stopSendCardAnimation();
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
            this.showTipNodeArr[index].getChildByName('ready').active = false;

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
        //let index = this.getUserChairIndex(chairID);
        //this.showTipNodeArr[index].getChildByName('ready').active = true;
    },

    onGameStart: function (curChairID, selfCardDataArr) {
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
            Global.AudioManager.playSound("Game/PaoDeKuai/Sound/sound_send_card");
            if (index === 16){
                // 显示先手玩家
                // 发牌动画结束后，第一个玩家开始出牌
                this.handCardWidgetCtrl.startGame();
                this.onUserStartOutCard(curChairID, true, false);
                // 停止动画
                this.stopSendCardAnimation();
            }
        }.bind(this));
        // 播放发牌动画
        this.showSendCardAnimation();
        // 显示玩家牌数
        for(let i = 0; i < 3; ++i){
            this.updateCardCount(i, 16);
        }
    },

    onUserStartOutCard: function (chairID, isNewTurn, enablePass) {
        let index = this.getUserChairIndex(chairID);
        // 设置下一个出牌玩家
        if (chairID === this.myChairID){
            this.operationBtnWidgetCtrl.startOutCard(isNewTurn, enablePass);
        }
        // 清理自己家的出牌
        let tipsNode = this.showTipNodeArr[index];
        for (let i = 0; i < tipsNode.children.length; ++i){
            tipsNode.children[i].active = false;
        }
        this.showOutCardNodeArr[index].removeAllChildren();
        // 开启定时器
        let clockTime = !enablePass?gameProto.OUT_CARD_TIME:3;
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
            let ctrl = node.getComponent('PDKShowOutCardWidgetCtrl');
            ctrl.initWidget(cardDataArr, index);
            // 播放动画
            this.playOutCardAnimation(cardDataArr, ctrl);
        }
    },

    onUserOutCard: function (chairID, cardDataArr, curChairID, leftCardCount, enablePass) {
        let index = this.getUserChairIndex(chairID);
        if (chairID !== this.myChairID){
            // 播放出牌音效
            this.playOutCardSound(!this.turnCardDataArr || this.turnCardDataArr.length === 0, cardDataArr);
            this.turnCardDataArr = cardDataArr;
            // 显示出牌
            let node = cc.instantiate(this.showOutCardWidgetPrefab);
            node.parent = this.showOutCardNodeArr[index];
            let ctrl = node.getComponent('PDKShowOutCardWidgetCtrl');
            ctrl.initWidget(cardDataArr, index);
            // 播放动画
            this.playOutCardAnimation(cardDataArr, ctrl);
        }

        // 清除定时器
        this.clockPosNodeArr[index].destroyAllChildren();
        // 更新玩家手牌数
        this.updateCardCount(chairID, leftCardCount);
        // 设置是否需要显示警告
        if (leftCardCount === 1) this.alertAnimationNodeArr[index].active = true;
        // 设置下一个出牌玩家
        if (curChairID >= 0){
            this.onUserStartOutCard(curChairID, false, enablePass);
        }
    },

    playOutCardSound: function (isFirst, cardDataArr) {
        let cardType = gameLogic.getCardType(cardDataArr);
        if (cardType === gameProto.cardType.SINGLE){
            let value = gameLogic.getCardValue(cardDataArr[0]);
            Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_" + value);
        } else if (cardType === gameProto.cardType.DOUBLE){
            let value = gameLogic.getCardValue(cardDataArr[0]);
            Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_dui" + value);
        } else if (cardType === gameProto.cardType.THREE){
            let value = gameLogic.getCardValue(cardDataArr[0]);
            Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_tuple" + value);
        } else if (cardType === gameProto.cardType.SINGLE_LINE){
            if (isFirst){
                Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_shunzi");
            } else{
                Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.DOUBLE_LINE){
            if (isFirst){
                Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_liandui");
            } else{
                Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.THREE_LINE){
            if (isFirst){
                Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_feiji");
            } else{
                Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.THREE_LINE_TAKE_ONE){
            if (isFirst){
                if (cardDataArr.length === 4){
                    Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_sandaiyi");
                }else{
                    Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_feiji");
                }
            } else{
                Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.THREE_LINE_TAKE_TWO){
            if (isFirst){
                if (cardDataArr.length === 5){
                    Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_sandaiyidui");
                }else{
                    Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_feiji");
                }
            } else{
                Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1,3));
            }
        } else if (cardType === gameProto.cardType.BOMB_CARD){
            Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_zhadan");
        } else if (cardType === gameProto.cardType.FOUR_LINE_TAKE_ONE){
            Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_sidaier");
        } else if (cardType === gameProto.cardType.FOUR_LINE_TAKE_TWO){
            Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_sidailiangdui");
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
        } else if (cardType === gameProto.cardType.SINGLE_LINE){
            this.showShunziAnimation(null, ctrl);
        } else if (cardType === gameProto.cardType.DOUBLE_LINE){
            this.showLianduiAnimation(null, ctrl);
        }
    },
    
    onUserPass: function (chairID, curChairID, isNewTurn, enablePass){
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
            this.onUserStartOutCard(curChairID, isNewTurn, enablePass);
        }

        Global.AudioManager.playSound("Game/PaoDeKuai/Sound/Man/Man_buyao1");
    },

    onUserBombWin: function (chairID, isTween) {
        for (let i = 0; i < 3; ++i){
            let index = this.getUserChairIndex(i);
            if (chairID === i){
                // 显示赢分动画
                if (isTween){
                    this.winScoreLabelArr[index].node.active = true;
                    this.winScoreLabelArr[index].string = "+" + Global.Utils.formatNumberToString(this.gameTypeInfo.baseScore * 10, 2) + "元";
                    this.winScoreLabelArr[index].node.position = cc.v2(0, -50);
                    this.winScoreLabelArr[index].node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 0)), cc.delayTime(2), cc.hide()]));
                }
                // 更新分数
                let goldCount = parseFloat(this.goldLabelArr[index].string) + this.gameTypeInfo.baseScore * 10;
                this.goldLabelArr[index].string = Global.Utils.formatNumberToString(goldCount, 2);
            }else{
                // 显示输分动画
                if (isTween){
                    this.loseScoreLabelArr[index].node.active = true;
                    this.loseScoreLabelArr[index].string = Global.Utils.formatNumberToString(this.gameTypeInfo.baseScore * -5, 2) + "元";
                    this.loseScoreLabelArr[index].node.position = cc.v2(0, -50);
                    this.loseScoreLabelArr[index].node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 0)), cc.delayTime(2), cc.hide()]));
                }
                // 更新分数
                let goldCount = parseFloat(this.goldLabelArr[index].string) - this.gameTypeInfo.baseScore * 5;
                this.goldLabelArr[index].string = Global.Utils.formatNumberToString(goldCount, 2);
            }

        }
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
                    let ctrl = node.getComponent('PDKShowHandCardWidgetCtrl');
                    ctrl.initWidget(cardArr.slice(j, j + 10), index);
                    node.parent = this.showHandCardNode[index];
                }
            }
        }
        // 播放音效
        if (resultData.winChairID === this.myChairID){
            Global.AudioManager.playSound("Game/PaoDeKuai/Sound/sound_win");
        }else{
            Global.AudioManager.playSound("Game/PaoDeKuai/Sound/sound_lose");
        }
        // 显示结果
        this.scheduleOnce(function () {
            // 创建结束界面
            let dialogParameters = {
                resultData: resultData,
                myChairID: this.myChairID,
                baseScore: this.baseScore,
                profitPercentage: this.profitPercentage,
                buttonEventCallback: this.onBtnClick.bind(this)
            };
            Global.DialogManager.createDialog('Game/PaoDeKuai/PDKResultDialog', dialogParameters, function () {
                /*this.resetGame();
                // 显示准备按钮
                this.operationBtnWidgetCtrl.startReady();
                // 设置定时器
                this.showClock(this.myChairID, gameProto.OPREATION_TIME + 10, function () {
                    roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
                    Global.DialogManager.addLoadingCircle();
                }.bind(this));*/
            }.bind(this));

            // 刷新用户信息
            this.updateUserInfo();
        }.bind(this), 3);
    },

    autoOutCard: function () {
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
    },

    showClock: function (chairID, time, timeOutCallback) {
        let node = cc.instantiate(this.clockWidgetPrefab);
        let ctrl = node.getComponent('PDKClockWidgetCtrl');
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
            if (Global.DialogManager.isDialogExit('Game/PaoDeKuai/PDKResultDialog')) Global.DialogManager.destroyDialog('Game/PaoDeKuai/PDKResultDialog', true);
            Global.CCHelper.releaseRes(['Game/PaoDeKuai']);
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
        node0.runAction(cc.sequence([cc.moveBy(0.2, cc.v2(0, -300)), cc.removeSelf()]));

        let node1 = cc.instantiate(this.cardNode);
        node1.active = true;
        node1.parent = this.cardNode.parent;
        node1.runAction(cc.sequence([cc.moveBy(0.2, cc.v2(400, -100)), cc.removeSelf()]));

        let node2 = cc.instantiate(this.cardNode);
        node2.active = true;
        node2.parent = this.cardNode.parent;
        node2.runAction(cc.sequence([cc.moveBy(0.2, cc.v2(-400, -100)), cc.removeSelf()]));
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

        let spriteNode = Global.CCHelper.createSpriteNode('Game/PaoDeKuai/Animation/shunzi/shunzi');
        spriteNode.parent = node;
        spriteNode.x = -200;
        let moveAction = cc.moveTo(0.3,cc.v2(0,0));
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

        let spriteNode = Global.CCHelper.createSpriteNode('Game/PaoDeKuai/Animation/shunzi/liandui');
        spriteNode.parent = node;
        spriteNode.x = -200;
        let moveAction = cc.moveTo(0.3,cc.v2(0,0));
        moveAction.easing(cc.easeOut(3));
        spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
    },
    
    // 飞机
    showFeijiAnimation: function () {
        let feijiSpriteNode = Global.CCHelper.createSpriteNode('Game/PaoDeKuai/Animation/feiji/1q');
        feijiSpriteNode.parent = this.animationNode;
        feijiSpriteNode.x = -800;
        feijiSpriteNode.y = 0;
        let moveAction1 = cc.moveTo(0.6, cc.v2(0, 0));
        moveAction1.easing(cc.easeOut(2));
        let moveAction2 = cc.moveTo(0.6, cc.v2(800, 0));
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

            let spriteNode = Global.CCHelper.createSpriteNode('Game/PaoDeKuai/Animation/feiji/1w');
            spriteNode.parent = node;
            spriteNode.x = -200;
            spriteNode.y = 0;
            let moveAction = cc.moveTo(0.3,cc.v2(0,0));
            moveAction.easing(cc.easeOut(2));
            spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
        }.bind(this), 1);
    },

    // 炸弹
    showZhadanAnimation: function () {
        let spriteNode = Global.CCHelper.createSpriteNode('Game/PaoDeKuai/Animation/zhadan/o');
        spriteNode.x = -200;
        spriteNode.parent = this.animationNode;
        spriteNode.runAction(cc.sequence([cc.jumpTo(0.3, cc.v2(0, 0), 100, 1), cc.callFunc(function () {
            let node = cc.instantiate(this.zhandanAnimationPrefab);
            node.parent = this.animationNode;
            let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
            ctrl.startAnimation(false, 1, function () {
                ctrl.node.removeFromParent();
            });
            spriteNode.removeFromParent();

            let zhandanNode = Global.CCHelper.createSpriteNode('Game/PaoDeKuai/Animation/zhadan/1');
            zhandanNode.scale = 0.6;
            let action1 = cc.scaleTo(0.5, 1);
            action1.easing(cc.easeBackOut());
            zhandanNode.runAction(cc.sequence([action1, cc.delayTime(0.2), cc.fadeOut(0.3),cc.removeSelf()]));
            zhandanNode.parent = this.animationNode;
        }.bind(this))]));
    }
});
