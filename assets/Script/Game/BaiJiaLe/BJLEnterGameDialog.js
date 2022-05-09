/*jshint esversion: 6 */
cc.Class({
	extends: cc.Component,
	properties: {
		goldLabel: cc.Label,
		content: cc.Node,
		item: cc.Prefab,
	},

	onLoad: function() {
		var i, gameData, item;
		var itemWidth = 300;
		if(this.content.width < itemWidth*this.dialogParameters.length) {
			this.content.x = (itemWidth*this.dialogParameters.length-this.content.width)/2;
			this.content.width = itemWidth*this.dialogParameters.length;
		}
		for(i = 0; i < this.dialogParameters.length; ++i) {
			gameData = this.dialogParameters[i].gameData;
			item = cc.instantiate(this.item);
			item.parent = this.content;
			item.setPosition(cc.p(-this.content.width/2+itemWidth*(i+0.5), 0));
			item.getComponent('BJLGameItem').setData(gameData, true);
		}
		this.goldLabel.string = Global.Player.getPy('gold');
        Global.MessageCallback.addListener('SelfEntryRoomPush', this);
	},

	onDestroy: function() {
        Global.MessageCallback.removeListener('SelfEntryRoomPush', this);
	},

	messageCallbackHandler: function(router, msg) {
		if(router === 'SelfEntryRoomPush') {
			if(msg.kindId === Global.Enum.gameType.BJL) {
                var BJLModel = require('./BJLModel');
                BJLModel.setEntryRoomData(msg);
                var needLoad = ['BaiJiaLe'];
                Global.CCHelper.loadRes(needLoad, function () {
                    Global.DialogManager.createDialog("BaiJiaLe/BJLMainDialog", null, function() {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.destroyDialog('BaiJiaLe/BJLEnterGameDialog');
                    });
                });
			}
		}
	},

	onButtonClick: function(event, param) {
		if(param === 'exit') {
			Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
				Global.DialogManager.destroyDialog(this);
			}.bind(this));
		}
		else if(param === 'addGold') {
			Global.DialogManager.createDialog('Recharge/RechargeDialog');
		}
		else if(param === 'detail') {
			Global.DialogManager.createDialog('GameCommon/GameRule/GameRuleDialog', {kind: Global.Enum.gameType.BJL});
		}
	},
});
