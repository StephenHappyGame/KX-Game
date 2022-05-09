var TTZModel = require('./TTZModel');
var RoomProto = require('../../API/RoomProto');

cc.Class({
	extends: cc.Component, 
	properties: {
		content: cc.Node,
		item: cc.Prefab,
		panel: cc.Node,
		userCountLabel: cc.Label,
	},

	start: function () {
		this.isOut = false;
		this.initScrollView();
		var userArr = TTZModel.getUsers();
		this.userCountLabel.string = userArr.length*5+Math.floor(Math.random()*10);
		Global.MessageCallback.addListener('RoomMessagePush', this);
		this.setOnLineCount();
		this.schedule(this.setOnLineCount.bind(this), 10);
	},

	setOnLineCount: function() {
		var userArr = TTZModel.getUsers();
		this.userCountLabel.string = userArr.length*5+Math.floor(Math.random()*10);
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
	},

	messageCallbackHandler: function (router, msg) {
		if(router === 'RoomMessagePush') {
			var userArr = TTZModel.getUsers();
			if(msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
				//this.userCountLabel.string = userArr.length*5;
				this.userCountLabel.string = userArr.length*5+Math.floor(Math.random()*10);
			}
			else if(msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				if(msg.data.roomUserInfo.userInfo.uid !== TTZModel.getMyUid()) {
					//this.userCountLabel.string = userArr.length*5;
					this.userCountLabel.string = userArr.length*5+Math.floor(Math.random()*10);
				}
			}
		}
	},

	initScrollView: function () {
		var userArr = TTZModel.getUsers();
		//this.userCountLabel.string = userArr.length*5+Math.floor(Math.random()*10);
		var height = 40 * userArr.length;
		if(height < 400) { height = 400; }
		this.content.removeAllChildren();
		this.content.height = height;
		for(var i = 0; i < userArr.length; ++i) {
			var item = cc.instantiate(this.item);
			item.parent = this.content;
			item.setPosition(cc.v2(0, 40*(-0.5-i)));
			var ctrl = item.getComponent('TTZOnLineItem');
			ctrl.setNameAndGold(userArr[i].userInfo.nickname, userArr[i].userInfo.gold);
		}
	},

	onButtonClick: function (event, param) {
		//if(param === 'online') {
		//	if(! this.isOut) {
		//		this.panel.stopAllActions();
		//		this.isOut = true;
		//		this.panel.runAction(cc.moveTo(0.2, cc.p(-335, -47)));
		//		this.initScrollView();
		//	} else {
		//		this.panel.stopAllActions();
		//		this.isOut = false;
		//		this.panel.runAction(cc.moveTo(0.2, cc.p(0, -47)));
		//	}
		//}
	},
});
