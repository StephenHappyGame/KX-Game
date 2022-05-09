var NNModel = require('./NNModel');
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';
var NNProto = require('./NNProto');

cc.Class({
    extends: cc.Component,

    properties: {
		cardSprite: cc.Sprite,
		touchSprite: cc.Sprite,
		tScrollView: cc.ScrollView,
		bScrollView: cc.ScrollView,
		tContent: cc.Node,
		bContent: cc.Node
    },

    onLoad: function () {
		this.touchSprite.node.on(cc.Node.EventType.TOUCH_START, this.touchStart.bind(this));
		this.touchSprite.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove.bind(this));
		this.touchSprite.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd.bind(this));
		this.touchSprite.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd.bind(this));
		this.homeScrollView();
		Global.MessageCallback.addListener('GameMessagePush', this);
    },

	onDestroy: function() {
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},

	offLineAndClient: function() {
		var myChairId = NNModel.getMyChairId();
		var myChairIndex = NNModel.getChairIdIndex(myChairId);
		if(myChairIndex < 0) { return; }
		var gameStatus = NNModel.getGameStatus();
		this.homeScrollView();
		if(gameStatus === NNProto.GAME_STATUS_SORTCARD) {
			var showCardArr = NNModel.getShowCardArr();
			var cardsArr = NNModel.getCardsArr()[myChairIndex];
			if(showCardArr[myChairIndex] !== 1) {
				this.answerResoutCardPush(cardsArr);
			}
		} 
	},

	messageCallbackHandler: function(router, msg) {
		if(router === 'GameMessagePush') {
			if(msg.type === NNProto.RESOUT_CARD_PUSH) {
				this.answerResoutCardPush(msg.data.cardArr);
			}
			else if(msg.type === NNProto.SHOW_CARD_PUSH) {
				this.answerShowCardPush(msg.data.chairId);
			}
			else if(msg.type === NNProto.GAME_RESOUT_PUSH) {
				this.answerGameResoutPush();
			}
		}
	},

	answerResoutCardPush: function(cardArr) {
		var lastCard = cardArr[cardArr.length-1];
		this.setCard(lastCard);
	},

	answerShowCardPush: function(chairId) {
		if(chairId === NNModel.getMyChairId()) {
			this.cardSprite.node.active = false;
		}
	},

	answerGameResoutPush: function() {
		this.cardSprite.node.active = false;
	},

	touchStart: function(event) {
		this.startPos = {};
		this.startPos.x = event.touch._point.x;
		this.startPos.y = event.touch._point.y;
		this.scrollDir = null;
	},

	touchMove: function(event) {
		var curPos = event.touch._point;
		if(this.scrollDir === null) {
			if(Math.abs(curPos.x-this.startPos.x) >= Math.abs(curPos.y-this.startPos.y)) {
				this.scrollDir = 'horizontal';
			} else {
				this.scrollDir = 'vertical';
			}
		}
		if(this.scrollDir === 'horizontal') {
			var offx = curPos.x-this.startPos.x;
			if(offx >= 146) {
				offx = 146;
			} 
			else if(offx <= -146) {
				offx = -146;
			}
			this.tScrollView.node.x = offx;
			this.tContent.x = offx;
			this.bScrollView.node.x = offx;
			this.bContent.x = -offx;
		} else {
			var offy = curPos.y-this.startPos.y;
			if(offy >= 204) {
				offy = 204;
			} 
			else if(offy <= -204) {
				offy = -204;
			}
			this.tScrollView.node.y = offy;
			this.tContent.y = offy;
			this.bScrollView.node.y = offy;
			this.bContent.y = -offy;
		}
	},

	touchEnd: function(event) {
		var curPos = event.touch._point;
		this.tScrollView.node.setPosition(cc.v2(0, 0));
		this.tContent.setPosition(cc.v2(0, 0));
		this.bScrollView.node.setPosition(cc.v2(0, 0));
		this.bContent.setPosition(cc.v2(0, 0));
		if(this.scrollDir === 'horizontal') {
			var offx = curPos.x-this.startPos.x;
			if(Math.abs(offx) >= 73) {
				this.tScrollView.node.active = false;
				this.bScrollView.node.active = false;
				this.cardSprite.node.x = offx;
				this.cardSprite.node.active = true;
				this.touchSprite.node.active = false;
				this.cardSprite.node.runAction(cc.moveTo(0.2, cc.v2(0, 0)));
				this.scheduleOnce(function() {
					Global.NetworkManager.notify(GameMessageRouter, NNProto.getShowCardNotifyData());
				}, 0.4);
			}
		} else {
			var offy = curPos.y-this.startPos.y;
			if(Math.abs(offy) >= 102) {
				this.tScrollView.node.active = false;
				this.bScrollView.node.active = false;
				this.cardSprite.node.y = offy;
				this.cardSprite.node.active = true;
				this.touchSprite.node.active = false;
				this.cardSprite.node.runAction(cc.moveTo(0.2, cc.v2(0, 0)));
				this.scheduleOnce(function() {
					Global.NetworkManager.notify(GameMessageRouter, NNProto.getShowCardNotifyData());
				}, 0.4);
			}
		}
		this.scrollDir = null;
	},

	setCard: function(cardId) {
		var url = 'Niuniu/NNCards/'+cardId;
		var nameArr = ['TSprite', 'BSprite', 'LSprite', 'RSprite'];
		for(var i = 0; i < nameArr.length; ++i) {
			var node = this.tContent.getChildByName(nameArr[i]);
            Global.CCHelper.updateSpriteFrame(url, node.getComponent(cc.Sprite));
		}
        Global.CCHelper.updateSpriteFrame(url, this.cardSprite);
		this.tScrollView.node.setPosition(cc.v2(0, 0));
		this.tContent.setPosition(cc.v2(0, 0));
		this.bScrollView.node.setPosition(cc.v2(0, 0));
		this.bContent.setPosition(cc.v2(0, 0));
		this.cardSprite.node.active = false;
		this.tScrollView.node.active = true;
		this.bScrollView.node.active = true;
		this.touchSprite.node.active = true;
	},

	homeScrollView: function() {
		this.tScrollView.node.setPosition(cc.v2(0, 0));
		this.tContent.setPosition(cc.v2(0, 0));
		this.bScrollView.node.setPosition(cc.v2(0, 0));
		this.bContent.setPosition(cc.v2(0, 0));
		this.cardSprite.node.active = false;
		this.tScrollView.node.active = false;
		this.bScrollView.node.active = false;
		this.touchSprite.node.active = false;
	}
});
