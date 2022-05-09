var BJLProto = require('./BJLProto');
var RoomProto = require('../../API/RoomProto');

cc.Class({
	extends: cc.Component,
	properties: {
		tickLabel: cc.Label,
		stateSprite: cc.Sprite,
	},

	onLoad: function() {
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('RoomMessagePush', this);
	},

	onDestroy: function() {
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('RoomMessagePush', this);
	},

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH){
				if(msg.data.gameData.gameStatus === BJLProto.STATUS_POUR) {
					this.startPour(msg.data.gameData.tickTm);
				} 
				else if(msg.data.gameData.gameStatus === BJLProto.STATUS_RESOUT) {
					this.startResout();
				}
            }
        }
		else if (router === "GameMessagePush") {
			if (msg.type === BJLProto.STATUS_PUSH) {
				if(msg.data.gameStatus === BJLProto.STATUS_POUR) {
					this.startPour();
				} 
				else if(msg.data.gameStatus === BJLProto.STATUS_RESOUT) {
					this.startResout();
				}
			}
		}
	},

	/*
	 * 开始下注倒计时
	 */
	startPour: function(pourTime) {
		this.unscheduleAllCallbacks();
		this.node.active = true;
		var tick = pourTime || BJLProto.POUR_TM;
		this.tickLabel.string = tick;
		var self = this;
		var callFunc = function() {
			-- tick;
			if(tick <= 0) {
				self.node.active = false;
				self.unschedule(callFunc);
				return;
			}
			self.tickLabel.string = tick;
			if(tick <= 3) {
				Global.AudioManager.playSound('BaiJiaLe/Audio/countdown');
			}
		};
		this.schedule(callFunc, 1);
	},

	startResout: function() {
		this.node.active = false;
	},
});
