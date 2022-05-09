var TWLogic = require('TWLogic');
var TWModel = require('TWModel');
var GameProto = require('./TWProto');
var RoomProto = require('../../API/RoomProto');
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';

cc.Class({
	extends: cc.Component,

	properties: {
		richLabel: cc.RichText
	},

	onLoad: function() {
	},

	onDestroy: function() {
	},

	setLabel: function(cardArr) {
		this.cardArr = cardArr;
		var name = '';
		if(TWLogic.hasYitiaolong(cardArr)) {
			name = '一条龙';
		}
		else if(TWLogic.hasSanhua(cardArr)) {
			name = '三花';
		}
		else if(TWLogic.hasSanshun(cardArr)) {
			name = '三顺';
		}
		else if(TWLogic.hasLiuduiban(cardArr)) {
			name = '六对半';
		}
		this.richLabel.string = '获得特殊免摆牌型(<color=#ffe35f>' + name + '</color>) 是否选择免摆';
	},

	onButtonClick: function(event, param) {
		if(param === 'confirm') {
			Global.NetworkManager.notify(GameMessageRouter, GameProto.getGameNosortRequestData(true), Date.now());
			this.node.destroy();
		}
		else if(param === 'cancel') {
			Global.NetworkManager.notify(GameMessageRouter, GameProto.getGameNosortRequestData(false), Date.now());
            this.node.destroy();
		}
	}
});

