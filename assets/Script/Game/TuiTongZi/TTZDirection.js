var TTZModel = require('TTZModel');
var TTZLogic = require('TTZLogic');

cc.Class({
    extends: cc.Component,
	properties: {
		content: cc.Node,
		item: cc.Prefab,
	},

	start: function () { 
		this.isOut = false;
	},

	fillScrollView: function () {
		this.content.removeAllChildren();
		var dirRecord = TTZModel.getGameDirRecord();
		var height = dirRecord.length * 40;
		if(height < 396) { height = 396; }
		for(var i = 0; i < dirRecord.length; ++i) {
			var item = cc.instantiate(this.item);
			item.parent = this.content;
			item.setPosition(cc.v2(0, -40*(i+0.5)));
			var ctrl = item.getComponent('TTZDirItem');
			ctrl.setLabel(this.getLabelStrByCards(dirRecord[dirRecord.length-i-1]));
		}
	},

	getLabelStrByCards: function (cardsArr) {
		var strArr = [];
		for(var i = 0; i < cardsArr.length; ++i) {
			if(cardsArr[i][0]%10 === cardsArr[i][1]%10) {
				strArr.push('豹子');
			} else {
				var count = (cardsArr[i][0] + cardsArr[i][1])%10;
				if(count%1 > 0) {
					strArr.push(Math.floor(count)+'点半');
				} else {
					strArr.push(count+'点');
				}
			}
		}
		return strArr;
	},

	onButtonClick: function (event, param) {
		if(! this.originPos) {
			this.originPos = this.node.getPosition();
		}
		if(param === 'zoushi') {
			if(! this.isOut) {
				this.isOut = !this.isOut;
				this.node.stopAllActions();
				this.node.runAction(cc.moveTo(0.2, cc.v2(this.originPos.x+445, this.originPos.y)));
				this.fillScrollView();
			} else {
				this.node.stopAllActions();
				this.isOut = !this.isOut;
				this.node.runAction(cc.moveTo(0.2, this.originPos));
			}
		}
	}
});

