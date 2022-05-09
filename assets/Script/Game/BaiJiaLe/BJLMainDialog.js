var BJLLogic = require('./BJLLogic');
var BJLProto = require('./BJLProto');
var RoomProto = require('../../API/RoomProto');
var RoomAPI = require('../../API/RoomAPI');
var model = require('./BJLModel');

cc.Class({
	extends: cc.Component,

	properties: {
        gameCommonCtrl: require("GameCommonController"),
		heLabel: cc.Label,
		xianLabel: cc.Label,
		xianDuiLabel: cc.Label,
		zhuangLabel: cc.Label,
		zhuangDuiLabel: cc.Label,
		myHeLabel: cc.Label,
		myXianLabel: cc.Label,
		myXianDuiLabel: cc.Label,
		myZhuangLabel: cc.Label,
		myZhuangDuiLabel: cc.Label,
		xianBetRectNode: cc.Node,
		xianDuiBetRectNode: cc.Node,
		zhuangBetRectNode: cc.Node,
		zhuangDuiBetRectNode: cc.Node,
		heBetRectNode: cc.Node,
		resoutNode: cc.Node,
		roadNode: cc.Node,
		gameCommonRoot: cc.Node,
	},
	
	start: function() {
        this.enableBet = false;
        this.gameResultData = null;
        this.gameInited = false;
        RoomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
	},

	onDestroy: function() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
	},

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
                if(msg.data.roomUserInfo.userInfo.uid === model.selfUid){
                    this.exitGame();
                }
            } 
			else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH){
                this.gameInit(msg.data.gameData); // 初始化界面场景
            }
        }
		else if (router === "GameMessagePush") {
            if (!this.gameInited) return;
            if (msg.type === BJLProto.POUR_GOLD_PUSH) {
                this.userBet(msg.data, true);
                this.updateBetCount(this.pourGoldObj);
            } 
			else if (msg.type === BJLProto.STATUS_PUSH) {
				if(msg.data.gameStatus === BJLProto.STATUS_POUR) {
					this.onGameStart();
				} 
				else if(msg.data.gameStatus === BJLProto.STATUS_RESOUT) {
				}
            } else if (msg.type === BJLProto.RESOUT_PUSH) {
                this.onGameEnd(msg.data);
            }
        } else if (router === "ReConnectSuccess"){
			Global.API.hall.joinRoomRequest(model.roomID, function() {
				this.onReconnection();
			}.bind(this));
        }
    },

	/*
	 * 断线重连
	 */
	onReconnection(){
        // 清理数据
        this.enableBet = false;
        this.gameResultData = null;
        this.gameInited = false;
        // 停止动作
        this.node.stopAllActions();
        // 更新下注信息
        this.updateBetCount(this.pourGoldObj);
        // 游戏公共控制重连
        this.gameCommonCtrl.onReconnection();
        // 请求场景数据
        RoomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
    },



	/*
	 * 游戏开始
	 */
	onGameStart(){
		this.pourGoldObj = {};
        this.updateBetCount(null);
        this.node.stopAllActions();
        // 执行游戏开始
        this.gameCommonCtrl.onGameStart();
        // 开启动作
        this.node.runAction(cc.sequence(
			cc.delayTime(1),
			cc.callFunc(this.onBetStart.bind(this)),
			cc.delayTime(BJLProto.POUR_TM),
			cc.callFunc(this.onBetStop.bind(this))
		));
		this.resoutNode.zIndex = 1;
		this.roadNode.zIndex = 2;
    },

	/*
	 * 开始下注
	 */
	onBetStart(){
        this.enableBet = true;
        this.gameCommonCtrl.onGameBetStart();
    },

	/*
	 * 结束下注
	 */
    onBetStop(){
        this.enableBet = false;
        this.gameCommonCtrl.onGameBetEnd();
        this.node.stopAllActions();
    },


	/*
	 * 游戏结束
	 */
    onGameEnd(data){
        this.gameResultData = data.resout;
        if (this.enableBet) this.onBetStop();
        this.node.stopAllActions();
		var cardCount = data.resout.cardsArr[0].length+data.resout.cardsArr[1].length;
		this.scheduleOnce(function() {
			this.onShowResult();
		}.bind(this), cardCount*3);
		this.resoutNode.zIndex = 2;
		this.roadNode.zIndex = 1;
    },

	/*
	 * 显示结果
	 */
    onShowResult(){
		var scoreChangeArr = [];
		for(var key in this.gameResultData.userWinObj) {
			if(this.gameResultData.userWinObj.hasOwnProperty(key)) {
				scoreChangeArr.push({ uid: key, score: this.gameResultData.userWinObj[key] });
			}
		}
		this.gameCommonCtrl.onGameResult(scoreChangeArr);
    },


	/*
	 * 用户下注
	 */
	userBet(data, isTween){
        var betRect = cc.rect(0,0,0,0);
        if(data.direction == BJLLogic.WIN_XIAN){
            betRect = this.xianBetRectNode.getBoundingBox();
		}
		else if(data.direction == BJLLogic.WIN_XIANDUI){
            betRect = this.xianDuiBetRectNode.getBoundingBox();
		}
		else if(data.direction == BJLLogic.WIN_ZHUANG){
            betRect = this.zhuangBetRectNode.getBoundingBox();
		}
		else if(data.direction == BJLLogic.WIN_ZHUANGDUI){
            betRect = this.zhuangDuiBetRectNode.getBoundingBox();
		}
		else if(data.direction == BJLLogic.WIN_HE){
            betRect = this.heBetRectNode.getBoundingBox();
		} else {
			return;
		}
		if(! this.pourGoldObj[data.direction]) {
			this.pourGoldObj[data.direction] = {};
		}
		if(this.pourGoldObj[data.direction][data.uid]) {
			this.pourGoldObj[data.direction][data.uid] += data.gold;
		} else {
			this.pourGoldObj[data.direction][data.uid] = data.gold;
		}
        this.gameCommonCtrl.userBet(data.uid, data.gold, betRect, isTween);
    },

	/*
	 * 更新下注数目
	 */
	updateBetCount(pourGoldObj){
		if(! pourGoldObj) {
			this.xianLabel.string = "0";
			this.xianDuiLabel.string = "0";
			this.zhuangLabel.string = "0";
			this.zhuangDuiLabel.string = "0";
			this.heLabel.string = "0";
			this.myXianLabel.string = "下注:0";
			this.myXianDuiLabel.string = "下注:0";
			this.myZhuangLabel.string = "下注:0";
			this.myZhuangDuiLabel.string = "下注:0";
			this.myHeLabel.string = "下注:0";
			return; 
		} else {
			var dir, uid, pour, myPour;
			var myUid = Global.Player.getPy('uid');
			for(dir in pourGoldObj) {
				if(pourGoldObj.hasOwnProperty(dir)) {
					pour = 0;
					myPour = 0;
					for(uid in pourGoldObj[dir]) {
						if(pourGoldObj[dir].hasOwnProperty(uid)) {
							pour += pourGoldObj[dir][uid];
						}
						if(uid === myUid) {
							myPour += pourGoldObj[dir][uid];
						}
					}
					if(dir == BJLLogic.WIN_XIAN) {
						this.xianLabel.string = pour.toString();
						this.myXianLabel.string = '下注:'+myPour.toString();
					}
					else if(dir == BJLLogic.WIN_XIANDUI) {
						this.xianDuiLabel.string = pour.toString();
						this.myXianDuiLabel.string = '下注:'+myPour.toString();
					}
					else if(dir == BJLLogic.WIN_ZHUANG) {
						this.zhuangLabel.string = pour.toString();
						this.myZhuangLabel.string = '下注:'+myPour.toString();
					}
					else if(dir == BJLLogic.WIN_ZHUANGDUI) {
						this.zhuangDuiLabel.string = pour.toString();
						this.myZhuangDuiLabel.string = '下注:'+myPour.toString();
					}
					else if(dir == BJLLogic.WIN_HE) {
						this.heLabel.string = pour.toString();
						this.myHeLabel.string = '下注:'+myPour.toString();
					}
				}
			}
		}
    },



	/*
	 * 初始化游戏
	 */
	gameInit(gameData){
        this.gameInited = true;
        this.gameCommonCtrl.onGameInit(model.profitPercentage, model.kindId);

        /* 设置筹码 */ 
		this.pourGoldObj = gameData.pourGoldObj;
		var dir, uid;
		this.scheduleOnce(function() {
		}.bind(this), 0.5);
        if(!! gameData.pourGoldObj){
			for(dir in gameData.pourGoldObj) {
				if(gameData.pourGoldObj.hasOwnProperty(dir)) {
					for(uid in gameData.pourGoldObj[dir]) {
						if(gameData.pourGoldObj[dir].hasOwnProperty(uid)) {
							this.userBet({ uid: uid, direction: dir, gold: gameData.pourGoldObj[dir][uid] }, false);
						}
					}
				}
			}
        }
        this.updateBetCount(this.pourGoldObj);
        if(gameData.gameStatus === BJLProto.STATUS_POUR){
            this.onGameStart();
        }
		else if(gameData.gameStatus === BJLProto.STATUS_RESOUT){
			this.resoutNode.zIndex = 2;
			this.roadNode.zIndex = 1;
			this.gameResultData = gameData.resultData;
			if(gameData.tickTm > 2) {
				this.scheduleOnce(function() {
					this.onShowResult();
				}, gameData.tickTm-2);
			} else {
				this.onShowResult();
			}
        }
    },


	/*
	 * 下注
	 */
    betEvent(event, param){
		var router = 'game.gameHandler.gameMessageNotify';
        if (!this.enableBet) return;
        if(param === 'zhuang'){
            RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_ZHUANG, this.gameCommonCtrl.getCurChipNumber()));
        }else if (param === 'xian'){
            RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_XIAN, this.gameCommonCtrl.getCurChipNumber()));
        }else if (param === 'zhuangdui'){
            RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_ZHUANGDUI, this.gameCommonCtrl.getCurChipNumber()));
        }else if (param === 'xiandui'){
            RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_XIANDUI, this.gameCommonCtrl.getCurChipNumber()));
        }else if (param === 'hu'){
            RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_HE, this.gameCommonCtrl.getCurChipNumber()));
        }
    },
	
	exitGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.destroyDialog(this, true);

            Global.CCHelper.releaseRes(['BaiJiaLe']);
        }.bind(this));
    }
});
