var TTZProto = require('./TTZProto');
var TTZModel = require('./TTZModel');

cc.Class({
	extends: cc.Component,
	properties: {
		titleWinNode: cc.Node,
		titleLoseNode: cc.Node,
		zhuangNode: cc.Node,
		tianmenNode: cc.Node,
		zhongmenNode: cc.Node,
		dimenNode: cc.Node,
		bankerScoreLabel: cc.Label,
		myScoreLabel: cc.Label,
		tickLabel: cc.Label,
	},

	start: function () {
		var resout = this.dialogParameters;
		this.showResout(resout);
		this.setTickLabel();
		var myUid = TTZModel.getMyUid();
		var bankerUid = TTZModel.getBankerUid();
		var myWin =  resout.usersWin[myUid];
		var profitPercentage = TTZModel.getProfitPercentage();
		if(myWin >= 0) {
			myWin = (myWin * (1-profitPercentage)).toFixed(2);
		}
		var showWin;
		if(resout.winArr[0] === true && resout.winArr[1] === true && resout.winArr[2] === true) {
			showWin = (bankerUid === myUid);
		}
		else if(resout.winArr[0] === false && resout.winArr[1] === false && resout.winArr[2] === false) {
			showWin = (bankerUid !== myUid);
		} else {
			showWin = (myWin && myWin >= 0);
		}
		this.myScoreLabel.string = myWin || '未投注';
		this.bankerScoreLabel.string = resout.bankerWin;
		this.titleWinNode.active = showWin;
		this.titleLoseNode.active = !showWin;
	},

	showResout: function (resout) {
		var dirArr = [TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		var nodeArr = [this.tianmenNode, this.zhongmenNode, this.dimenNode];
		for(var i = 0; i < dirArr.length; ++i) {
			this.showCard(nodeArr[i], resout.cardsArr[dirArr[i]], !resout.winArr[i]);
		}
		this.showCard(this.zhuangNode, resout.cardsArr[0], resout.bankerWin > 0);
	},

	showCard: function (chooseNode, cardArr, isWin) {
		var word1 = chooseNode.getChildByName('Card1').getChildByName('Word');
		var word2 = chooseNode.getChildByName('Card2').getChildByName('Word');
		var url1, url2;
		if(cardArr[0]%10 === 0) {
			url1 = 'TuiTongZi/Common/img_mj_01';
		} else {
			url1 = 'TuiTongZi/Common/img_mj_0' + (cardArr[0]%10+1);
		}
		if(cardArr[1]%10 === 0) {
			url2 = 'TuiTongZi/Common/img_mj_01';
		} else {
			url2 = 'TuiTongZi/Common/img_mj_0' + (cardArr[1]%10+1);
		}
		cc.loader.loadRes(url1, cc.SpriteFrame, function(err, res) {
			if(! err) {
				word1.getComponent(cc.Sprite).spriteFrame = res;
			} else {
				console.log('error showCard', err.message);
			}
		});
		cc.loader.loadRes(url2, cc.SpriteFrame, function(err, res) {
			if(! err) {
				word2.getComponent(cc.Sprite).spriteFrame = res;
			} else {
				console.log('error showCard', err.message);
			}
		});
		var nameArr = ['BaoziSprite', 'NumLabel', 'DotSprite', 'BanSprite'];
		for(var i = 0; i < nameArr.length; ++i) {
			chooseNode.getChildByName(nameArr[i]).active = false;
		}
		if(cardArr[0]%10 === cardArr[1]%10) {
			chooseNode.getChildByName('BaoziSprite').active = true;
		} else {
			var count = (cardArr[0]+cardArr[1])%10;
			var numLabel = chooseNode.getChildByName('NumLabel');
			numLabel.active = true;
			numLabel.getComponent(cc.Label).string = Math.floor(count%10);
			chooseNode.getChildByName('DotSprite').active = true;
			if(cardArr[0]%10 == 0 || cardArr[1]%10 == 0) {
				chooseNode.getChildByName('BanSprite').active = true;
			}
		}
		var resoutNode = chooseNode.getChildByName('ResoutSprite');
		var winUrl = 'TuiTongZi/Common/clip_loseWin0';
		if(! isWin) { winUrl = 'TuiTongZi/Common/clip_loseWin1'; }
		cc.loader.loadRes(winUrl, cc.SpriteFrame, function(err, res) {
			if(! err) {
				resoutNode.getComponent(cc.Sprite).spriteFrame = res;
			} else {
				console.log('error showCard', err.message);
			}
		});
	},

	onButtonClick: function (event, param) {
		if(param === 'close') {
			this.unscheduleAllCallbacks();
			Global.DialogManager.destroyDialog(this, true);
		}
	},

	setTickLabel: function () {
		var tick = 3;
		this.tickLabel.string = tick;
		var self = this;
		var callFunc = function() {
			-- tick;
			self.tickLabel.string = tick;
			if(tick === 0) {
				Global.DialogManager.destroyDialog(self, true);
				self.unschedule(callFunc);
			}
		};
		this.schedule(callFunc, 1);
	},
});
