var TTZModel = require('./TTZModel');
var RoomProto = require('../../API/RoomProto');
var TTZProto = require('./TTZProto');

cc.Class({
    extends: cc.Component,

    properties: {
		settleNode: cc.Node,
		startNode: cc.Node,
		pourNode: cc.Node,
		sortCardNode: cc.Node,
		pourLabel: cc.Label,
		tickLabel: cc.Label,
	},

	start: function () {
		this.showStatus();
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},

	messageCallbackHandler: function (router, msg) {
		if(router === 'GameMessagePush') {
			if(msg.type === TTZProto.GAME_STATUSCHANGE_PUSH) {
				this.showStatus(msg.data.gameStatus);
			}
			else if(msg.type === TTZProto.GAME_POURGOLD_PUSH) {
				this.setPourLabel();
			}
		}
		else if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
				this.showStatus();
			}
		}
	},

	showStatus: function (gameStatus) {
		if(! gameStatus) { gameStatus = TTZModel.getGameStatus(); }
		this.unscheduleAllCallbacks();
		if(gameStatus === TTZProto.GAME_STATUS_WAITING) {			// 未开始
			this.unShowAllNode();
		}
		else if(gameStatus === TTZProto.GAME_STATUS_SORTCARD) {		// 摆牌中
			this.setStatusSortCard();
		}
		else if(gameStatus === TTZProto.GAME_STATUS_POUR) {			// 下注中
			this.setStatusPourGold();
		}
		else if(gameStatus === TTZProto.GAME_STATUS_RESOUT) {		// 显示结果中
			this.unShowAllNode();
		}
		else if(gameStatus === TTZProto.GAME_STATUS_SETTLE) {		// 结算中
			this.setStatusSettle();
		}
		else if(gameStatus === TTZProto.GAME_STATUS_START) {		// 开始中
			this.showStartGame();
		}
	},

	unShowAllNode: function () {
		this.settleNode.active = false;
		this.startNode.active = false;
		this.pourNode.active = false;
		this.sortCardNode.active = false;
	},

	showStartGame: function () {	// 第*回合游戏即将开始
		this.unShowAllNode();
		var bureau = TTZModel.getBureau();
		this.startNode.active = true;
		var url = 'TuiTongZi/Common/clip_huihe'+ (bureau-1);
		var self = this;
		cc.loader.loadRes(url, cc.SpriteFrame, function(err, res) {
			if(! err) {
				self.startNode.getChildByName('BureauSprite').getComponent(cc.Sprite).spriteFrame = res;
			} else {
				console.log('error showStartGame', err.message);
			}
		});

		var tick = TTZProto.GAMESTART_SECOND;
		this.startNode.getChildByName('Label').getComponent(cc.Label).string = tick;
		var callFunc = function() {
			-- tick;
			self.startNode.getChildByName('Label').getComponent(cc.Label).string = tick;
			if(tick === 0) {
				self.startNode.active = false;
				self.unschedule(callFunc);
			}
		};
		this.schedule(callFunc, 1);
	},

	// 摆牌中
	setStatusSortCard: function () {
		this.unShowAllNode();
		this.sortCardNode.active = true;
		var label = this.sortCardNode.getChildByName('Label');
		var tick = TTZProto.SORTCARD_SECOND;
		label.getComponent(cc.Label).string = tick;
		var self = this;
		var callFunc = function() {
			if(tick < 0) {
				self.unschedule(callFunc);
				return;
			}
			-- tick;
			label.getComponent(cc.Label).string = tick;
		};
		this.schedule(callFunc, 1);
	},

	// 下注中
	setStatusPourGold: function () {
		this.unShowAllNode();
		this.pourNode.active = true;
		this.setPourLabel();
		var self = this;
		var tick = TTZProto.POURGOLD_SECOND;
		this.tickLabel.string = tick;
		var callFunc = function() {
			-- tick;
			self.tickLabel.string = tick;
			if(tick < 0) {
				self.tickLabel.string = '';
				self.unschedule(callFunc);
			}
		};
		this.schedule(callFunc, 1);
	},

	setPourLabel: function () {
		var pourGold = TTZModel.getAllPourGold();
		//var bankerPourPool = TTZModel.getBankerPourPool();
		//this.pourLabel.string = pourGold + '/'+ bankerPourPool.curGold;
		this.pourLabel.string = pourGold;
	},

	// 结算中
	setStatusSettle: function () {
		this.unShowAllNode();
		this.settleNode.active = true;
		var label = this.settleNode.getChildByName('Label');
		var tick = TTZProto.SETTLE_SECOND;
		label.getComponent(cc.Label).string = tick;
		var self = this;
		var callFunc = function() {
			if(tick < 0) {
				self.unschedule(callFunc);
				return;
			}
			-- tick;
			label.getComponent(cc.Label).string = tick;
		};
		this.schedule(callFunc, 1);
	},
});


