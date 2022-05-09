var TWModel = require('./TWModel');
var TWLogic = require('./TWLogic');
var roomAPI = require('../../API/RoomAPI');
var RoomProto = require('../../API/RoomProto');
var GameProto = require('./TWProto');

let READY_MAX_WAIT_TIME = 15;

cc.Class({
	extends: cc.Component,

	properties: {
        headItemArr: [require('TWHeadItem')],
        cardItemArr: [require('TWCardItem')],
		glassSprite: cc.Sprite,

        readyBtn: cc.Node,
        continueNode: cc.Node,

        sortCardWidgetPrefab: cc.Prefab,
        guaiPaiTipWidgetPrefab: cc.Prefab,

        waitNextTip: cc.Node
	},

	onLoad: function() {
	    this.gameInited = false;
        this.sortCardWidgetCtrl = null;

        this.readyScheduler = null;

		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        Global.MessageCallback.addListener('SelfEntryRoomPush', this);
	},

    start: function () {
        roomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
    },

    onDestroy: function() {
	    TWModel.onDestroy();

        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
        Global.MessageCallback.removeListener('SelfEntryRoomPush', this);
    },

    onButtonClick: function(event, param) {
        if(param === 'rule') {
            Global.DialogManager.createDialog('GameCommon/GameRule/GameRuleDialog', {kind: Global.Enum.gameType.SSS});
        }
        else if(param === 'setting') {
            Global.DialogManager.createDialog('Setting/SettingDialog');
        }
        else if(param === 'exit_room') {
            if (!this.gameInited) return;
            Global.DialogManager.addPopDialog('确认退出游戏?', function() {
                if (Global.Player.getPy('roomID')){
                    roomAPI.roomMessageNotify(RoomProto.userLeaveRoomNotify());
                    Global.DialogManager.addLoadingCircle();
                }else{
                    this.exitGame();
                }
            }.bind(this), function() {});
        }
        else if(param === 'continue_game') {
            roomAPI.roomMessageNotify(RoomProto.userReadyNotify(true));
            this.readyBtn.active = false;
            this.onUserReady(TWModel.myChairId);
            for(let i = 0; i < this.cardItemArr.length; ++i) {
                this.cardItemArr[i].node.active = false;
            }

            if (!!this.readyScheduler){
                this.unschedule(this.readyScheduler);
                this.readyScheduler = null;
            }
        }else if(param === "continue"){
            Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: TWModel.gameTypeInfo.gameTypeID});
        }
    },
	
	messageCallbackHandler: function(router, msg) {
		if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_LEAVE_ROOM_RESPONSE) {
                if(msg.data.chairId === TWModel.myChairId){
                    Global.DialogManager.removeLoadingCircle();
                    //Global.Player.setPy('roomID', null);
                    //this.exitGame();
                    /*Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog(this);
                    }.bind(this));*/
                }
			} else if(msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
                if (!this.gameInited) return;
				this.onUserEntry(msg.data.roomUserInfo);
			} else if(msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
                if (!this.gameInited) return;
			    this.onUserLeave(msg.data.roomUserInfo.chairId);
			} else if(msg.type === RoomProto.USER_READY_PUSH) {
                if (!this.gameInited) return;
			    this.onUserReady(msg.data.chairId);
			} else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH){
                // 初始化界面场景
                this.gameInit(msg.data);
            } else if (msg.type === RoomProto.ROOM_USER_INFO_CHANGE_PUSH){
                if (!this.gameInited) return;
			    TWModel.updatePlayer(msg.data.changeInfo);
            }
		} else if(router === 'GameMessagePush') {
		    if (!this.gameInited) return;
			if(msg.type === GameProto.GAME_CARDS_PUSH) {
                this.onSendCards(msg.data);
			} else if(msg.type === GameProto.GAME_CARDS_SORT_PUSH) {
			    this.onCardSort(msg.data);
			} else if(msg.type === GameProto.GAME_RESOUT_PUSH) {
				this.onGameResult(msg.data);
			} else if(msg.type === GameProto.GAME_CARDS_NOSORT_PUSH) {
                this.onCardNoSort(msg.data);
            }
		} else if(router === 'ReConnectSuccess') {
            if(Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(TWModel.roomID, function() {
                    this.onReconnection();
                }, function () {
                    this.exitGame();
                }.bind(this));
            } else {
                this.exitGame();
            }
		}
	},

	gameInit: function (data) {
	    this.gameInited = true;
	    TWModel.init(data);
        for(let i = 0; i < 4; ++i) {
            this.cardItemArr[TWModel.getIndexByChairId(i)].setChairId(i);
        }
        for(let i = 0; i < 4; ++i){
            this.headItemArr[TWModel.getIndexByChairId(i)].setChairId(i);
        }
        /*this.readyBtn.active = (TWModel.gameStatus === GameProto.GAME_STATUS_NOTSTART);
        // 开启准备定时器
        if (!!this.readyBtn.active){
            if (!!this.readyScheduler){
                this.unschedule(this.readyScheduler);
            }
            this.readyScheduler = function () {
                // 发送退出房间的请求
                Global.API.room.roomMessageNotify(RoomProto.userLeaveRoomNotify());
                Global.DialogManager.addLoadingCircle();

                Global.DialogManager.addPopDialog("由于您长时间未准备，已离开房间", function () {});
            };
            this.scheduleOnce(this.readyScheduler, READY_MAX_WAIT_TIME);
        }*/
        if (TWModel.gameStatus === GameProto.GAME_STATUS_NOTSTART){
            // 自动发送准备
            Global.API.room.roomMessageNotify(RoomProto.userReadyNotify(true));
        }
        // 游戏中显示摆牌界面
        if (TWModel.gameStatus === GameProto.GAME_STATUS_GAMEING){
            if(!TWModel.hasSortCard(TWModel.myChairId)) {
                let index = TWModel.playingChairArr.indexOf(TWModel.myChairId);
                if (index < 0) {
                    this.waitNextTip.active = true;
                    return;
                }
                let myCardArr = TWModel.getCardsArr()[index];
                let node = cc.instantiate(this.sortCardWidgetPrefab);
                node.parent = this.node;
                this.sortCardWidgetCtrl = node.getComponent('TWSortCardWidgetCtrl');
                this.sortCardWidgetCtrl.setCardArr(myCardArr);
                if(TWLogic.hasGuaipai(myCardArr)) {
                    let guaiPaiNode = cc.instantiate(this.guaiPaiTipWidgetPrefab);
                    guaiPaiNode.parent = this.node;
                    guaiPaiNode.getComponent('TWGuaipaiTipWidgetCtrl').setLabel(myCardArr);
                }
            }
        }else if (TWModel.gameStatus === GameProto.GAME_STATUS_SETTLE){
            // 计算结束时间
            this.scheduleOnce(this.onShowGameResultFinished.bind(this), data.gameData.leftGameEndTime/1000 + 2);

            this.waitNextTip.active = true;
        }
    },

    onReconnection: function () {
        roomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
    },

    onUserEntry: function (roomUserInfo) {
        TWModel.addPlayer(roomUserInfo);

        let headItemCtrl = this.headItemArr[TWModel.getIndexByChairId(roomUserInfo.chairId)];
        headItemCtrl.node.active = true;
        headItemCtrl.setChairId(roomUserInfo.chairId);
    },

    onUserLeave: function (chairId) {
	    if(chairId === TWModel.myChairId) {
	        this.exitGame();
	        return;
        }
        TWModel.delPlayer(chairId);
        let headItem = this.headItemArr[TWModel.getIndexByChairId(chairId)];
        headItem.node.active = false;
    },

    onUserReady: function (chairID) {
        TWModel.setPlayerReady(chairID);
        let headItem = this.headItemArr[TWModel.getIndexByChairId(chairID)];
        if (!!headItem){
            headItem.setReady(true);
        }
    },

    onSendCards: function (data) {
        TWModel.setCardsPushData(data.cardsArr, data.playingChairArr);

        let cardsArr = data.cardsArr;
        let myCardArr = cardsArr[data.playingChairArr.indexOf(TWModel.getMyChairId())];
        this.scheduleOnce(function() {
            let node = cc.instantiate(this.sortCardWidgetPrefab);
            node.parent = this.node;
            this.sortCardWidgetCtrl = node.getComponent("TWSortCardWidgetCtrl");
            this.sortCardWidgetCtrl.setCardArr(myCardArr);

            if(TWLogic.hasGuaipai(myCardArr)) {
                let guaiPaiNode = cc.instantiate(this.guaiPaiTipWidgetPrefab);
                guaiPaiNode.parent = this.node;
                guaiPaiNode.getComponent('TWGuaipaiTipWidgetCtrl').setLabel(myCardArr);
            }
        }.bind(this), 2.5);

        for (let i = 0; i < this.cardItemArr.length; ++i){
            this.cardItemArr[i].onSendCardPush();
        }

        for(let i = 0; i < this.headItemArr.length; ++i){
            this.headItemArr[i].onGameStart();
        }
    },

    onCardSort: function (data) {
        TWModel.insertSortChairArr(data.chairId);
        TWModel.cardsArr[data.chairId] = data.cardArr;

        if(data.chairId === TWModel.myChairId) {
            if(!data.isNosort) {
                this.sortCardWidgetCtrl.setCardArr(data.cardArr);
            }
        }

        if (data.chairId === TWModel.myChairId){
            this.sortCardWidgetCtrl.node.destroy();
        }

        let cardItem = this.cardItemArr[TWModel.getIndexByChairId(data.chairId)];
        if (!!cardItem){
            cardItem.onSortCardsPush();
        }
    },

    onCardNoSort: function (data) {
        TWModel.setMianbai(data.chairId);

        let cardItem = this.cardItemArr[(data.chairId+4-TWModel.myChairId)%4];
        cardItem.getComponent('TWCardItem').onShowGuaiPai();
    },

    onGameResult: function (data) {
        Global.AudioManager.playSound('ThirteenWater/TWSound/tw_kaiju');
        TWModel.setResoutData(data.resout);

        for(let i = 0; i < TWModel.playingChairArr.length; ++i){
            let cardItem = this.cardItemArr[TWModel.getIndexByChairId(TWModel.playingChairArr[i])];
            cardItem.showCard(data.resout, this.onShowGameResultFinished.bind(this));
        }
    },

    onShowGameResultFinished: function () {
        this.waitNextTip.active = false;

	    //this.readyBtn.active = true;
        this.continueNode.active = true;
	    for (let i = 0; i < this.headItemArr.length; ++i){
	        this.headItemArr[i].updateUserInfo();
        }

        /*if (!!this.readyScheduler){
            this.unschedule(this.readyScheduler);
        }
        this.readyScheduler = function () {
            // 发送退出房间的请求
            Global.API.room.roomMessageNotify(RoomProto.userLeaveRoomNotify());
            Global.DialogManager.addLoadingCircle();

            Global.DialogManager.addPopDialog("由于您长时间未准备，已离开房间", function () {});
        };
        this.scheduleOnce(this.readyScheduler, READY_MAX_WAIT_TIME);*/
    },

	answerRoomDismisssPush: function(reason) {
		Global.Player.setPy('roomID', 0);
		if(reason === RoomProto.roomDismissReason.NONE) {	/* 正常结束 */ 
		}
		else if(reason === RoomProto.roomDismissReason.RDR_OWENER_ASK) {	/* 房主解散 */
			if(TWModel.getMyChairId() !== 0) {
				Global.DialogManager.addPopDialog('因房主退出房间,房间解散', function() {
					this.destroyMainDialog();
				}.bind(this));
			} else {
				this.destroyMainDialog();
			}
		}
		else if(reason === RoomProto.roomDismissReason.RDR_USER_ASK) {	/* 游戏中,请求结束 */
			this.node.getChildByName('ExitButton').active = true;
		}
		else if(reason === RoomProto.roomDismissReason.RDR_TIME_OUT) { /* 超时未响应 */
		}
	},

	answerExitRoomPush: function(data) {
		let arr = data.chairIdArr;
        let myChairId = TWModel.getMyChairId();
        let count = 0, i;
		for(i = 0; i < arr.length; ++i) {
			if(arr[i] !== null) { ++ count; }
		}
		if(count === 1 && arr[myChairId] === null) {
			Global.DialogManager.createDialog('ThirteenWater/TWDismissDialog');
		}
	},

	answerNosortPush: function(chairId, isNosort) {
		if(isNosort) { TWModel.setMianbai(chairId); }
	},

	answerGameResoutPush: function(data) {
	},

	answerGameEndPush: function(data) {
		if(! this.cardItemArr[0].getComponent('TWCardItem').getIsOnAnimal()) {
			Global.DialogManager.createDialog('ThirteenWater/TWSettleAllDialog', null, function(err, dialog) {
				dialog.getComponent('TWSettleAllDialog').showResout(TWModel.getGameEndData());
			});
		}
	},

	answerGamePreparePush: function(data) {
		//TWModel.setGamePrepareData(data);
	},

	answerGameCardSortPush: function(chairId) {
		if(chairId === TWModel.getMyChairId()) {
			Global.DialogManager.destroyDialog('ThirteenWater/TWSortCardDialog', true);
		}
	},

	destroyMainDialog: function() {
	    this.exitGame();
/*		Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this);
        });*/
	},

	getHeadItemByChairId: function(chairId) {
		let myChairId = TWModel.getMyChairId();
		return this.headItemArr[(chairId+4-myChairId)%4].getChildByName('chatPos');
	},

	glassAnimal: function(cb) {
		Global.AudioManager.playSound('ThirteenWater/TWSound/tw_suiboli');
		this.scheduleOnce(function() {
			Global.AudioManager.playSound('ThirteenWater/TWSound/tw_sanchuan');
		}, 0.5);
		this.glassSprite.node.active = true;
		this.scheduleOnce(function() {
			this.glassSprite.node.active = false;
			if(!! cb) {
				cb();
			}
		}.bind(this), 1.5);
	},
    
    exitGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.removeLoadingCircle();
            Global.DialogManager.destroyDialog(this, true);
            Global.CCHelper.releaseRes(['ThirteenWater']);
        }.bind(this));
    }
});
