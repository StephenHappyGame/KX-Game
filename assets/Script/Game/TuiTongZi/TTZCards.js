var TTZProto = require('./TTZProto');
var RoomProto = require('../../API/RoomProto');
var TTZModel = require('./TTZModel');
var TTZLogic = require('./TTZLogic');

cc.Class({
    extends: cc.Component,

	properties: {
		sortCardNode: cc.Node,
		tianmenNode: cc.Node,
		zhongmenNode: cc.Node,
		dimenNode: cc.Node,
		zhuangNode: cc.Node,
		handNode: cc.Node,
		sendCardNode: cc.Node,
	},

	start: function () {
		this.audioManager = this.node.parent.getComponent('TTZMainDialog').getAudioManager();
		this.initSortCard();
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		this.reconnect();
	},

	reconnect: function () {			// 断线重连|中途进游戏
		var gameStatus = TTZModel.getGameStatus();
		var bureau = TTZModel.getBureau();
		for(var i = 0; i < this.cardNodeArr.length; ++i) {
			this.cardNodeArr[i].stopAllActions();
			if(gameStatus === TTZProto.GAME_STATUS_WAITING || gameStatus === TTZProto.GAME_STATUS_START || gameStatus === TTZProto.GAME_STATUS_POUR) {
				this.cardNodeArr[i].active = (i >= (bureau-1)*8);
			}
			else if(gameStatus === TTZProto.GAME_STATUS_RESOUT || gameStatus === TTZProto.GAME_STATUS_SETTLE) {
				this.cardNodeArr[i].active = (i >= bureau*8);
			}
		}
		if(gameStatus !== TTZProto.GAME_STATUS_RESOUT) {
			this.recoveryCards();
		} else {
			this.showResout();
		}
	},

	onDestroy: function () {
		this.unscheduleAllCallbacks();
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},

	messageCallbackHandler: function (router, msg) {
		if(router === 'GameMessagePush') {
			if(msg.type === TTZProto.GAME_STATUSCHANGE_PUSH) {		// 状态推送
				this.gameStatusChange(msg.data.gameStatus);
			}
			else if(msg.type === TTZProto.GAME_RESOUT_PUSH) {		// 结果推送
				this.cardsArr = msg.data.resout.cardsArr;
			}
		}
		else if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
				this.reconnect();
			}
		}
	},

	gameStatusChange: function (gameStatus) {
		if(! gameStatus) {
			gameStatus = TTZModel.getGameStatus();
		}
		if(gameStatus === TTZProto.GAME_STATUS_WAITING) {			// 未开始
			//this.unShowAllNode();
		}
		else if(gameStatus === TTZProto.GAME_STATUS_SORTCARD) {		// 摆牌中
			this.playSortCardAnimal();
			this.audioManager.playStartGame();
		}
		else if(gameStatus === TTZProto.GAME_STATUS_POUR) {			// 下注中
			//this.setStatusPourGold();
		}
		else if(gameStatus === TTZProto.GAME_STATUS_RESOUT) {		// 显示结果中
			this.scheduleOnce(function() {
				this.playSendCardAnimal();
			}.bind(this), 2);
		}
		else if(gameStatus === TTZProto.GAME_STATUS_SETTLE) {		// 结算中
			this.recoveryCards();
		}
		else if(gameStatus === TTZProto.GAME_STATUS_START) {		// 开始中
			this.audioManager.playStartGame();
		}
	},

	initSortCard: function () {
		this.cardNodeArr = [];
		this.cardNodePosArr = [];
		this.sendCardPosArr = [];
		var i, node, tmp;
		for(i = 0; i < 40; ++i) {
			node = this.getCardNode();
			node.parent = this.sortCardNode;
			if(i%2 === 0) {
				this.cardNodePosArr.push(cc.v2((19.5-i/2)*10, 0));
			} else {
				this.cardNodePosArr.push(cc.v2((19.5-Math.floor(i/2))*10, 4));
			}
			node.setPosition(this.cardNodePosArr[i]);
			this.cardNodeArr.push(node);
		}
		for(i = 0; i < 8; ++i) {
			node = this.sendCardNode.getChildByName('Card'+(i+1));
			this.sendCardPosArr.push(node.getPosition());
		}
	},

	playSortCardAnimal: function () {
		var self = this;
		for(var i = 0; i < this.cardNodeArr.length; ++i) {
			this.cardNodeArr[i].active = true;
		}
		var callFunc = function() {
			var offArr = [3, 6, 9, 12, -3, -6, -9, -12];
			var random, pos, fadeOutTm;
			for(var i = 0; i < self.cardNodeArr.length; ++i) {
				pos = cc.v2(self.cardNodePosArr[i].x+offArr[Math.floor(Math.random()*offArr.length)], self.cardNodePosArr[i].y+offArr[Math.floor(Math.random()*offArr.length)]);
				self.cardNodeArr[i].runAction(cc.moveTo(0.2, pos));
				fadeOutTm = Math.random()*0.2;
				self.cardNodeArr[i].runAction(cc.fadeOut(fadeOutTm));
				self.cardNodeArr[i].runAction(cc.fadeIn(0.2-fadeOutTm));
			}
		};
		this.schedule(callFunc, 0.2);
		this.scheduleOnce(function() {
			self.unschedule(callFunc);
			for(var i = 0; i < self.cardNodeArr.length; ++i) {
				self.cardNodeArr[i].stopAllActions();
				self.cardNodeArr[i].opacity = 255;
				self.cardNodeArr[i].setPosition(self.cardNodePosArr[i]);
			}
		}, 4);
	},

	playSendCardAnimal: function () {
		var touzi = TTZModel.getTouzi();
		var touziCount = touzi.touzi1 + touzi.touzi2;
		var bureau = TTZModel.getBureau(), index = 0;
		var handNodePos = this.handNode.getPosition();
		var sortCardNodePos = this.sortCardNode.getPosition();
		var sendCardNodePos = this.sendCardNode.getPosition();
		var sendCardPosArr = this.sendCardPosArr;
		var self = this;

		var sendCardFunc = function() {
			var chooseNodeArr = [self.zhuangNode, self.tianmenNode, self.zhongmenNode, self.dimenNode];
			var preChooseNode = chooseNodeArr[(touziCount-1+Math.floor(index/2))%4];
			if(index > 0) {
				preChooseNode.getChildByName('Card1').active = true;
				preChooseNode.getChildByName('Card2').active = true;
				var sendCard1 = self.sendCardNode.getChildByName('Card'+(index-1));
				var sendCard2 = self.sendCardNode.getChildByName('Card'+(index));
				sendCard1.setPosition(sendCardPosArr[index-2]);
				sendCard2.setPosition(sendCardPosArr[index-1]);
				sendCard1.active = false;
				sendCard2.active = false;
			}
			if(index === 8) {
				self.unschedule(sendCardFunc);
				self.playFlipAnimal(touziCount);
				return;
			}
			var chooseNode = chooseNodeArr[(touziCount+Math.floor(index/2))%4];
			var pos1 = chooseNode.getChildByName('Card1').getPosition();
			var pos2 = chooseNode.getChildByName('Card2').getPosition();
			var node1 = self.sendCardNode.getChildByName('Card'+(index+1));
			var node2 = self.sendCardNode.getChildByName('Card'+(index+2));
			node1.runAction(cc.moveTo(0.05, cc.v2(pos1.x - sendCardNodePos.x, pos1.y - sendCardNodePos.y)));
			node2.runAction(cc.moveTo(0.05, cc.v2(pos2.x - sendCardNodePos.x, pos2.y - sendCardNodePos.y)));
			index += 2;
		};

		var putCardFunc = function() {
			var curIndex = index+(bureau-1)*8;
			if(index > 0) {
				self.cardNodeArr[curIndex-2].active = false;
				self.cardNodeArr[curIndex-1].active = false;
				self.cardNodeArr[curIndex-2].setPosition(self.cardNodePosArr[curIndex-2]);
				self.cardNodeArr[curIndex-1].setPosition(self.cardNodePosArr[curIndex-1]);
				self.sendCardNode.getChildByName('Card'+(index-1)).active = true;
				self.sendCardNode.getChildByName('Card'+index).active = true;
			}
			if(index === 8) {
				self.unschedule(putCardFunc);
				index = 0;
				self.scheduleOnce(function() {
					self.schedule(sendCardFunc, 0.1);
				}, 0.5);
				return;
			}
			var node1 = self.cardNodeArr[curIndex];
			var node2 = self.cardNodeArr[curIndex+1];
			var pos1 = self.sendCardNode.getChildByName('Card'+(index+1)).getPosition();
			var pos2 = self.sendCardNode.getChildByName('Card'+(index+2)).getPosition();
			node1.runAction(cc.moveTo(0.1, cc.v2(pos1.x-sortCardNodePos.x, pos1.y-sortCardNodePos.y)));
			node2.runAction(cc.moveTo(0.1, cc.v2(pos2.x-sortCardNodePos.x, pos2.y-sortCardNodePos.y)));
			index += 2;
		};

		var getCardFunc = function() {
			var curIndex = index+(bureau-1)*8;
			if(index === 8) {
				self.unschedule(getCardFunc);
				index = 0;
				self.schedule(putCardFunc, 0.1);
				return;
			}
			var node;
			if(curIndex%2 == 0) {
				node = self.cardNodeArr[curIndex+1];
			} else {
				node = self.cardNodeArr[curIndex-1];
			}
			var pos = cc.v2(handNodePos.x-sortCardNodePos.x, handNodePos.y-sortCardNodePos.y);
			node.runAction(cc.moveTo(0.1, pos));
			++index;
		};
		this.schedule(getCardFunc, 0.1);
	},

	playFlipAnimal: function (touziCount) {
		var self = this;
		var index = 0;
		var chooseNodeArr = [self.zhuangNode, self.tianmenNode, self.zhongmenNode, self.dimenNode];
		var callFunc = function() {
			var chooseNode = chooseNodeArr[(touziCount+index)%4];
			var cardArr = self.cardsArr[(touziCount+index)%4];
			var animalCtrl1 = chooseNode.getChildByName('Card1').getComponent(cc.Animation);
			animalCtrl1.play('FlipCardAnimation');
			self.audioManager.playFlipCard();
			var word1 = chooseNode.getChildByName('Word1');
			var word2 = chooseNode.getChildByName('Word2');
			self.scheduleOnce(function() {
				var animalCtrl2 = chooseNode.getChildByName('Card2').getComponent(cc.Animation);
				animalCtrl2.play('FlipCardAnimation');
				self.audioManager.playFlipCard();
				self.updateNodeFrame(self.getCardUrl(cardArr[0]), word1);
				word1.active = true;
			}, 0.2);
			self.scheduleOnce(function() {
				self.updateNodeFrame(self.getCardUrl(cardArr[1]), word2);
				word2.active = true;
				self.setCardType(chooseNode, cardArr);
			}, 0.4);
			self.scheduleOnce(function() {
				var count = self.getCardType(cardArr);
				if(count === 10) {
					self.audioManager.playBaozi();
				} else {
					self.audioManager.playDot(count);
				}
			}, 0.6);
			++index;
			if(index === 4) {
				self.unschedule(callFunc);
				var winArr = TTZModel.getResout().winArr;
				if(winArr[0] && winArr[1] && winArr[2]) {
					self.scheduleOnce(function() {
						self.audioManager.playWinAll();
					}, 1);
				} 
				else if(!winArr[0] && !winArr[1] && !winArr[2]) {
					self.scheduleOnce(function() {
						self.audioManager.playLoseAll();
					}, 1);
				}
			}
		};
		this.schedule(callFunc, 0.8);
	},

	showResout: function () {
		var self = this;
		var resout = TTZModel.getResout();
		var chooseNodeArr = [self.zhuangNode, self.tianmenNode, self.zhongmenNode, self.dimenNode];
		var dirArr = [TTZProto.ZHUANGJIA, TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		var callFunc = function(chooseNode, cardArr) {
			var nameArr = ['Card1', 'Card2', 'Word1', 'Word2'];
			var urlArr = ['TuiTongZi/Common/mj5', 'TuiTongZi/Common/mj5', self.getCardUrl(cardArr[0]), self.getCardUrl(cardArr[1])];
			cc.loader.loadResArray(urlArr, cc.SpriteFrame, function(err, res) {
				if(! err) {
					for(var i = 0; i < nameArr.length; ++i) {
						var node = chooseNode.getChildByName(nameArr[i]);
						node.getComponent(cc.Sprite).spriteFrame = res[i];
						node.active = true;
					}
				}
			});
		};
		for(var i = 0; i < chooseNodeArr.length; ++i) {
			var chooseNode = chooseNodeArr[i]; 
			var cardArr = resout.cardsArr[dirArr[i]];
			callFunc(chooseNode, cardArr);
			this.setCardType(chooseNode, cardArr);
		}
	},

	getCardUrl: function (cardIndex) {
		var url = 'TuiTongZi/Common/img_mj_0'+(cardIndex%10+1);
		if(cardIndex%10+1 === 10) {
			url = 'TuiTongZi/Common/img_mj_10';
		}
		return url;
	},

	setCardType: function (chooseNode, cardArr) {
		var nameArr = ['Baozi', 'Count', 'Dot', 'Ban'];
		for(var i = 0; i < nameArr.length; ++i) {
			chooseNode.getChildByName(nameArr[i]).active = false;
		}
		if(TTZLogic.verifyCardsIsBaozi(cardArr)) {
			chooseNode.getChildByName('Baozi').active = true;
		} else {
			var count = TTZLogic.getCardNumber(cardArr[0])+TTZLogic.getCardNumber(cardArr[1]);
			var countLabel = chooseNode.getChildByName('Count');
			countLabel.active = true;
			countLabel.getComponent(cc.Label).string = Math.floor(count%10);
			chooseNode.getChildByName('Dot').active = true;
			chooseNode.getChildByName('Ban').active = (count%1 > 0);
		}
	},

	// 结算时清理场景
	recoveryCards: function () {
		this.unscheduleAllCallbacks();
		var nodeArr = [this.zhuangNode, this.tianmenNode, this.zhongmenNode, this.dimenNode];
		var nameArr = ['Card1', 'Card2', 'Word1', 'Word2', 'Baozi', 'Count', 'Dot', 'Ban'];
		for(var i = 0; i < nodeArr.length; ++i) {
			for(var j = 0; j < nameArr.length; ++j) {
				nodeArr[i].getChildByName(nameArr[j]).active = false;
			}
			this.updateNodeFrame('TuiTongZi/Common/mj1', nodeArr[i].getChildByName('Card1'));
			this.updateNodeFrame('TuiTongZi/Common/mj1', nodeArr[i].getChildByName('Card2'));
		}
	},

	getCardNode: function () {
		var node = new cc.Node();
		var sprite = node.addComponent(cc.Sprite);
		var url = 'TuiTongZi/Common/mj1';
		cc.loader.loadRes(url, cc.SpriteFrame, function(err, spriteFrame) {
			if(! err) {
				sprite.spriteFrame = spriteFrame;
				node.width = 10;
				node.height = 15;
			} else {
				console.log('error getCardNode', err.message);
			}
		});
		return node;
	},

	updateNodeFrame: function (url, node) {
		cc.loader.loadRes(url, cc.SpriteFrame, function(err, spriteFrame) {
			if(! err) {
				node.getComponent(cc.Sprite).spriteFrame = spriteFrame;
			} else {
				console.log('error updateNodeFrame', err.message);
			}
		});
	},

	getCardType: function (cardArr) {
		if(cardArr[0]%10 === cardArr[1]%10) {
			return 10;
		} else {
			return Math.floor((cardArr[0]+cardArr[1])%10);
		}
	},
});

