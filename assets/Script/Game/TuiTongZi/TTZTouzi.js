var TTZProto = require('./TTZProto');
var RoomProto = require('../../API/RoomProto');
var TTZModel = require('./TTZModel');
cc.Class({
    extends: cc.Component,

	properties: {
		touziNode1: cc.Node,
		touziNode2: cc.Node,
		touziNode3: cc.Node,
		touziNode4: cc.Node,
	},

	start: function () {
		this.audioManager = this.node.parent.getComponent('TTZMainDialog').getAudioManager();
		Global.MessageCallback.addListener('GameMessagePush', this);
	},

	reconnect: function () {
		this.stopAnimal();
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},

	messageCallbackHandler: function (router, msg) {
		if(router === 'GameMessagePush') {
			if(msg.type === TTZProto.GAME_TOUZI_PUSH) {		// 骰子推送
				this.startAnimal(msg.data.touzi1, msg.data.touzi2);
			}
		}
		else if(router === 'GameMessagePush') {
			if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
				this.reconnect();
			}
		}
	},

	stopAnimal: function () {
		this.isOnAnimal = false;
		this.touziNode1.getComponent(cc.Animation).stop();
		this.touziNode2.getComponent(cc.Animation).stop();
		this.touziNode1.active = false;
		this.touziNode2.active = false;
		this.touziNode3.active = false;
		this.touziNode4.active = false;
	},

	startAnimal: function (touzi1, touzi2) {
		this.touziNode1.active = true;
		this.touziNode2.active = true;
		var animalCtrl1 = this.touziNode1.getComponent(cc.Animation);
		animalCtrl1.play('TouziAnimation');
		var animalCtrl2 = this.touziNode2.getComponent(cc.Animation);
		animalCtrl2.play('TouziAnimation');
		var self = this;
		this.isOnAnimal = true;
		this.audioManager.playDice();
		this.scheduleOnce(function() {
			if(! self.isOnAnimal) { return; }
			animalCtrl1.stop();
			animalCtrl2.stop();
			self.touziNode1.active = false;
			self.touziNode2.active = false;
			self.touziNode3.active = true;
			self.touziNode4.active = true;
			var url1 = 'TuiTongZi/Common/09-' + touzi1;
			var url2 = 'TuiTongZi/Common/09-' + touzi2;
			cc.loader.loadRes(url1, cc.SpriteFrame, function(err, spriteFrame) {
				if(! err) {
					var sprite = self.touziNode3.getComponent(cc.Sprite);
					sprite.spriteFrame = spriteFrame;
				} else {
					console.log('error startAnimal', err.message);
				}
			});
			cc.loader.loadRes(url2, cc.SpriteFrame, function(err, spriteFrame) {
				if(! err) {
					var sprite = self.touziNode4.getComponent(cc.Sprite);
					sprite.spriteFrame = spriteFrame;
				} else {
					console.log('error startAnimal', err.message);
				}
			});
			self.scheduleOnce(function() {
				if(! self.isOnAnimal) { return; }
				self.touziNode3.active = false;
				self.touziNode4.active = false;
			}, 3);
		}, 1);
	},
});
