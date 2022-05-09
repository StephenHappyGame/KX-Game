var TTZProto = require('./TTZProto');
var RoomProto = require('../../API/RoomProto');
var TTZModel = require('./TTZModel');
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';

cc.Class({
    extends: cc.Component,
	properties: {
		bankerDownButton: cc.Button,
		twoThousandButton: cc.Button,
		threeThousandButton: cc.Button,
	},

	start: function () {
		//this.gameStatusChange();
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('RoomMessagePush', this);
	},

	reconnect: function () {		// 断线重连|中途进游戏
		this.gameStatusChange();
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('GameMessagePush', this);
		Global.MessageCallback.removeListener('RoomMessagePush', this);
	},

	messageCallbackHandler: function (router, msg) {
		if(router === 'GameMessagePush') {
			if(msg.type === TTZProto.GAME_STATUSCHANGE_PUSH) {		// 状态推送
				//this.gameStatusChange(msg.data.gameStatus);
			}
			else if(msg.type === TTZProto.GAME_CONTINUEBANKER_PUSH) {	// 须庄推送
				//this.answerContinueBanker();
			}
		}
		else if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
				//TTZModel.setEntryRoomData(msg.data);
				//this.reconnect();
			}
		}
	},

	answerContinueBanker: function () {
		this.bankerDownButton.node.active = false;
		this.twoThousandButton.node.active = false;
		this.threeThousandButton.node.active = false;
	},

	gameStatusChange: function (gameStatus) {
		var myUid = TTZModel.getMyUid();
		var bankerUid = TTZModel.getBankerUid();
		if(myUid === bankerUid && gameStatus === TTZProto.GAME_STATUS_SETTLE) {		// 结算中
			var bankGold = TTZModel.getBankGold();
			var bankPour = TTZModel.getBankerPourPool();
			var banker = TTZModel.getBanker();
			var canPourGold = banker.userInfo.gold;
			this.bankerDownButton.node.active = true;
			this.twoThousandButton.node.active = true;
			this.threeThousandButton.node.active = true;
			if(bankGold === 3000 || canPourGold < bankGold+1000) {	// 庄家金币不足或者已经不能须庄
				this.twoThousandButton.interactable = false;
				this.threeThousandButton.interactable = false;
			} else {
				if(bankGold === 2000) {
					this.twoThousandButton.interactable = false;
					this.threeThousandButton.interactable = (canPourGold >= bankGold+1000);
				} else {
					this.twoThousandButton.interactable = (canPourGold >= bankGold+1000);
					this.threeThousandButton.interactable = (canPourGold >= bankGold+2000);
				}
			}
			this.bankerDownButton.interactable = (TTZModel.getBureau() >= 3);
			if(bankPour.curGold < bankGold) {
				this.bankerDownButton.interactable = true;
			}
		} else {
			this.bankerDownButton.node.active = false;
			this.twoThousandButton.node.active = false;
			this.threeThousandButton.node.active = false;
		}
	},

	onButtonClick: function (event, param) {
		if(param === 'down') {
			Global.NetworkManager.notify(GameMessageRouter, TTZProto.askToBePlayerRequestData());
		}
		else if(param === '2000') {
			Global.NetworkManager.notify(GameMessageRouter, TTZProto.continueBankerRequestData(2000));
		}
		else if(param === '3000') {
			Global.NetworkManager.notify(GameMessageRouter, TTZProto.continueBankerRequestData(3000));
		}
	},
});
