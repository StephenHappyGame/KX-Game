var TTZProto = require('./TTZProto');
var RoomProto = require('../../API/RoomProto');
var TTZModel = require('./TTZModel');

cc.Class({
    extends: cc.Component,

	properties: {
		rootNode: cc.Node,
		button1: cc.Node,
		button2: cc.Node,
		button3: cc.Node,
		button4: cc.Node,
		button5: cc.Node,
	},

	start: function () {
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		/*this.button1.y = 20;*/
		this.button1.getComponent(cc.Button).interactable = false;
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},

	messageCallbackHandler: function (router, msg) {
		if(router === 'GameMessagePush') {
			if(msg.type === TTZProto.GAME_STATUSCHANGE_PUSH) {		// 状态推送
				//this.gameStatusChange(msg.data.gameStatus);
			}
			else if(msg.type === TTZProto.GAME_BANKERCHANGE_PUSH) {		// 庄家变化
				this.bankerChange(msg.data.bankerUid);
			}

		}
		else if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
				this.bankerChange(msg.data.gameData.bankerUid);
			}
		}
	},

	bankerChange: function (bankerUid) {
		if(! bankerUid) { bankerUid = TTZModel.getBankerUid(); }
		this.rootNode.active = (bankerUid !== TTZModel.getMyUid());
	},

	onButtonClick: function (event, param) {
		/*var gameStatus = TTZModel.getGameStatus();
		if(gameStatus !== TTZProto.GAME_STATUS_POUR) {
			return;
		}*/
		var buttonArr = [this.button1, this.button2, this.button3, this.button4, this.button5];
		var coinArr = [1, 10, 50, 100, 500];
		for(var i = 0; i < buttonArr.length; ++i) {
			if(parseInt(param) === coinArr[i]) {
				/*buttonArr[i].y = 20;*/
				buttonArr[i].getComponent(cc.Button).interactable = false;
				TTZModel.setChooseCoin(coinArr[i]);
			} else {
				/*buttonArr[i].y = 0;*/
				buttonArr[i].getComponent(cc.Button).interactable = true;
			}
		}
	},
});

