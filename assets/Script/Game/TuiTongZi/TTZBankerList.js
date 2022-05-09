var TTZProto = require('./TTZProto');
var TTZModel = require('./TTZModel');
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';

cc.Class({
    extends: cc.Component,
	properties: {
		content: cc.Node,
		bankerListItem: cc.Prefab,
	},

	start: function () {
		this.isOut = false;
		this.originPos = this.node.getPosition();
		//Global.MessageCallback.addListener('GameMessagePush', this);
	},

	onDestroy: function () {
		//Global.MessageCallback.removeListener('GameMessagePush', this);
	},

	messageCallbackHandler: function (router, msg) {
		var myUid = TTZModel.getMyUid();
		if(router === 'GameMessagePush') {
			if(msg.type === TTZProto.GAME_BANKERCHANGE_PUSH) {			// 换庄推送
			}
			else if(msg.type === TTZProto.GAME_ASKTOBEBANKER_PUSH) {		// 换庄推送
				if(msg.data.bankerUid === myUid) {
					if(this.isOut) { this.pullMenu(); }
				}
			}
		}
	},

	onButtonClick: function (event, param) {
		var me = TTZModel.getMe();
		var gold = me.userInfo.gold;
		if(param !== 'banker' && gold < parseInt(param)) {
			console.log('error: gold not enough');
			return;
		}
		if(param === '3000') {
			Global.NetworkManager.notify(GameMessageRouter, TTZProto.askToBeBankerRequestData(3000));
			this.pullMenu();
		}
		else if(param === '2000') {
			Global.NetworkManager.notify(GameMessageRouter, TTZProto.askToBeBankerRequestData(2000));
			this.pullMenu();
		}
		else if(param === '1000') {
			Global.NetworkManager.notify(GameMessageRouter, TTZProto.askToBeBankerRequestData(1000));
			this.pullMenu();
		}
		else if(param === 'banker') {
			this.pullMenu();
		}
	},

	pullMenu: function () {
		if(this.isOut) {
			this.isOut = false;
			this.node.stopAllActions();
			this.node.runAction(cc.moveTo(0.2, cc.v2(this.originPos.x, this.originPos.y)));
		} else {
			this.isOut = true;
			this.node.stopAllActions();
			this.node.runAction(cc.moveTo(0.2, cc.v2(this.originPos.x+640, this.originPos.y)));
			this.fillScrollView();
		}
	},

	fillScrollView: function () {
		this.content.removeAllChildren();
		var bankerList = TTZModel.getBankerPool();
		var keyArr = ['3000', '2000', '1000'];
		var bankerCount;
		var i;
		for(i = 0; i < keyArr.length; ++i) {
			bankerCount += bankerList[keyArr[i]].length;
		}
		var banker = TTZModel.getBanker();
		if(banker) { bankerCount += 1; }
		var height = bankerCount * 80;
		if(height < 490) { height = 490; }
		this.content.height = height;

		var item, ctrl, user;
		var posIndex = 0;
		if(banker) {
			posIndex = 0.5;
			item = cc.instantiate(this.bankerListItem);
			item.parent = this.content;
			item.setPosition(cc.v2(0, -80*posIndex));
			ctrl = item.getComponent('TTZBankerItem');
			var bankerPourPool = TTZModel.getBankerPourPool();
			ctrl.setNameAndGold(banker.userInfo.nickname, bankerPourPool.pourGold, true);
		}
		for(i = 0; i < keyArr.length; ++i) {
			for(var j = 0; j < bankerList[keyArr[i]].length; ++j) {
				user = TTZModel.getUserByUid(bankerList[keyArr[i]][j]);
				if(user) {
					++ posIndex;
					item = cc.instantiate(this.bankerListItem);
					ctrl = item.getComponent('TTZBankerItem');
					ctrl.setNameAndGold(user.userInfo.nickname, keyArr[i], false);
					item.parent = this.content;
					item.setPosition(cc.v2(0, -80*posIndex));
				} else {
					console.log('error can not find user', bankerList[keyArr[i]][j]);
				}
			}
		}
	},
});

