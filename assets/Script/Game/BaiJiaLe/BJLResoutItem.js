var BJLLogic = require('./BJLLogic');
var BJLProto = require('./BJLProto');
var RoomProto = require('../../API/RoomProto');

cc.Class({
	extends: cc.Component,
	properties: {
		xianNode: cc.Node,
		zhuangNode: cc.Node,
		winSprite: cc.Sprite,
	},

	onLoad: function() {
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('RoomMessagePush', this);
		this.node.active = false;
	},

	onDestroy: function() {
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('RoomMessagePush', this);
	},

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH){
				if(msg.data.gameData.gameStatus === BJLProto.STATUS_POUR) {
					this.node.active = false;
				} else {
					this.node.active = true;
					this.reconectResout(msg.data.gameData.resultData.cardsArr, msg.data.gameData.resultData.type);
				}
            }
        }
		else if(router === "GameMessagePush") {
            if(msg.type === BJLProto.RESOUT_PUSH) {
				this.node.active = true;
				var myUid = Global.Player.getPy('uid');
				this.isWin = false;
				if(msg.data.resout.userWinObj[myUid] && msg.data.resout.userWinObj[myUid] > 0) {
					this.isWin = true;
				}
				this.showResout(msg.data.resout.cardsArr, msg.data.resout.type);
            } 
			else if(msg.type === BJLProto.STATUS_PUSH) {
				if(msg.data.gameStatus === BJLProto.STATUS_POUR) {
					this.node.active = false;
				}
			}
		}
	},

	/*
	 * 显示结果
	 */
	showResout: function(cardsArr, type) {
		var xianLabel = this.xianNode.getChildByName('XianLabel');
		var zhuangLabel = this.zhuangNode.getChildByName('ZhuangLabel');
		this.winSprite.node.active = false;
		xianLabel.active = false;
		zhuangLabel.active = false;
		this.xianNode.getChildByName('XianSprite').active = false;
		this.zhuangNode.getChildByName('ZhuangSprite').active = false;
		var arr1 = cardsArr[0];
		var arr2 = cardsArr[1];
		var i;
		var nodeArr = [
			this.xianNode.getChildByName('Card1'),
			this.zhuangNode.getChildByName('Card1'),
			this.xianNode.getChildByName('Card2'),
			this.zhuangNode.getChildByName('Card2'),
		];
		var cardArr = [arr1[0], arr2[0], arr1[1], arr2[1]];
		if(arr1[2]) {
			nodeArr.push(this.xianNode.getChildByName('Card3'));
			cardArr.push(arr1[2]);
		}
		if(arr2[2]) {
			nodeArr.push(this.zhuangNode.getChildByName('Card3'));
			cardArr.push(arr2[2]);
		}
		for(i = 1; i <= 3; ++i) {
			this.xianNode.getChildByName('Card'+i).active = false;
			this.zhuangNode.getChildByName('Card'+i).active = false;
		}
		for(i = 0; i < nodeArr.length; ++i) {
			Global.CCHelper.updateSpriteFrame('GameCommon/Card/card_back', nodeArr[i].getComponent(cc.Sprite));
		}

		var xianCount = 0, zhuangCount = 0, index = -1;
		var self = this;
		var callFunc = function() {	/* 亮牌 */
			++index;
			if(index >= nodeArr.length) {
				self.unschedule(callFunc);
				self.showDotAnimal(type, cardsArr);
				return;
			}
			nodeArr[index].active = true;
			if(nodeArr[index].parent === self.xianNode) {
				if(index < 4) {
					Global.AudioManager.playSound('BaiJiaLe/Audio/player');
				} else {
					if(BJLLogic.getCardCount(cardArr[index]) === 8) {
						Global.AudioManager.playSound('BaiJiaLe/Audio/player_8');
					}
					else if(BJLLogic.getCardCount(cardArr[index]) === 9) {
						Global.AudioManager.playSound('BaiJiaLe/Audio/player_9');
					} else {
						Global.AudioManager.playSound('BaiJiaLe/Audio/player_add');
					}
				}
			} else {
				if(index < 4) {
					Global.AudioManager.playSound('BaiJiaLe/Audio/banker');
				} else {
					if(BJLLogic.getCardCount(cardArr[index]) === 8) {
						Global.AudioManager.playSound('BaiJiaLe/Audio/banker_8');
					}
					else if(BJLLogic.getCardCount(cardArr[index]) === 8) {
						Global.AudioManager.playSound('BaiJiaLe/Audio/banker_9');
					} else {
						Global.AudioManager.playSound('BaiJiaLe/Audio/banker_add');
					}
				}
			}

			nodeArr[index].runAction(cc.sequence(
				cc.scaleTo(0.1, 0, 1),
				cc.callFunc(function() {
					Global.CCHelper.updateSpriteFrame(self.getCardUrl(cardArr[index]), nodeArr[index].getComponent(cc.Sprite));
					Global.AudioManager.playSound('BaiJiaLe/Audio/flipcard');
					if(nodeArr[index].parent == self.xianNode) {
						xianCount += BJLLogic.getCardCount(cardArr[index]);
						xianLabel.active = true;
						self.xianNode.getChildByName('XianSprite').active = true;
						xianLabel.getComponent(cc.Label).string = xianCount%10;
					} else {
						zhuangCount += BJLLogic.getCardCount(cardArr[index]);
						zhuangLabel.active = true;
						self.zhuangNode.getChildByName('ZhuangSprite').active = true;
						zhuangLabel.getComponent(cc.Label).string = zhuangCount%10;
					}
				}),
				cc.scaleTo(0.1, 1, 1)
			));
		};
		this.schedule(callFunc, 1.2);
	},

	/*
	 * 显示点数动画
	 */
	showDotAnimal: function(type, cardsArr) {
		var tm = 0;
		this.scheduleOnce(function() {
			Global.AudioManager.playSound('BaiJiaLe/Audio/player');
		}, 1);
		this.scheduleOnce(function() {
			Global.AudioManager.playSound('BaiJiaLe/Audio/point_'+BJLLogic.getCardArrCount(cardsArr[0]));
		}, 2);
		tm = 2;
		this.scheduleOnce(function() {
			Global.AudioManager.playSound('BaiJiaLe/Audio/banker');
		}, 1+tm);
		this.scheduleOnce(function() {
			Global.AudioManager.playSound('BaiJiaLe/Audio/point_'+BJLLogic.getCardArrCount(cardsArr[1]));
		}, 2+tm);
		tm += 2;
		this.scheduleOnce(function() {
			this.showWinSprite(type);
		}.bind(this), 0.5+tm);
		tm += 0.5;
	},

	/*
	 * 显示输赢
	 */
	showWinSprite: function(type) {
		this.winSprite.node.active = true;
		if((type&BJLLogic.WIN_ZHUANG) > 0) {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/zhuangying', this.winSprite);
		}
		else if((type&BJLLogic.WIN_XIAN) > 0) {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/xianying', this.winSprite);
		}
		else {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/he', this.winSprite);
		}
		var self = this;
		this.winSprite.node.setScale(1.3);
		this.winSprite.node.runAction(cc.sequence(
			cc.scaleTo(0.2, 1, 1),
			cc.callFunc(function() {
				Global.AudioManager.playSound('BaiJiaLe/Audio/papa');

			}),
			cc.delayTime(0.5),
			cc.callFunc(function() {
				if((type&BJLLogic.WIN_ZHUANG) > 0) {
					Global.AudioManager.playSound('BaiJiaLe/Audio/banker_win');
				}
				else if((type&BJLLogic.WIN_XIAN) > 0) {
					Global.AudioManager.playSound('BaiJiaLe/Audio/player_win');
				}
				else {
					Global.AudioManager.playSound('BaiJiaLe/Audio/tie');
				}
				if(self.isWin) {
					Global.AudioManager.playSound('BaiJiaLe/Audio/win_game');
				}
			})
		));
	},

	/*
	 * 断线重连时显示结果
	 */
	reconectResout: function(cardsArr, type) {
		var xianLabel = this.xianNode.getChildByName('XianLabel');
		var zhuangLabel = this.zhuangNode.getChildByName('ZhuangLabel');
		this.winSprite.node.active = true;
		xianLabel.active = true;
		zhuangLabel.active = true;
		this.xianNode.getChildByName('XianSprite').active = true;
		this.zhuangNode.getChildByName('ZhuangSprite').active = true;
		var arr1 = cardsArr[0];
		var arr2 = cardsArr[1];
		var i, node;
		for(i = 0; i < 3; ++i) {
			node = this.xianNode.getChildByName('Card'+(i+1));
			if(i < arr1.length) {
				node.active = true;
				Global.CCHelper.updateSpriteFrame(this.getCardUrl(arr1[i]), node.getComponent(cc.Sprite));
			} else {
				node.active = false;
			}
			node = this.zhuangNode.getChildByName('Card'+(i+1));
			if(i < arr2.length) {
				node.active = true;
				Global.CCHelper.updateSpriteFrame(this.getCardUrl(arr2[i]), node.getComponent(cc.Sprite));
			} else {
				node.active = false;
			}
		}

		var xianCount = 0, zhuangCount = 0;
		for(i = 0; i < arr1.length; ++i) {
			xianCount += BJLLogic.getCardCount(arr1[i]);
		}
		for(i = 0; i < arr2.length; ++i) {
			zhuangCount += BJLLogic.getCardCount(arr2[i]);
		}
		xianLabel.getComponent(cc.Label).string = xianCount;
		zhuangLabel.getComponent(cc.Label).string = zhuangCount;
		if((type&BJLLogic.WIN_ZHUANG) > 0) {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/zhuangying', this.winSprite);
		}
		else if((type&BJLLogic.WIN_XIAN) > 0) {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/xianying', this.winSprite);
		}
		else {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/he', this.winSprite);
		}
	},

	/*
	 *
	 */
	getCardUrl: function(cardId) {
		var num = cardId%13+1;
		var color = Math.floor(cardId/13);
		var url = 'GameCommon/Card/';
		if(color === 0) {
			url += num;
		}
		else if(color === 1) {
			url += (16+num);
		}
		else if(color === 2) {
			url += (32+num);
		}
		else if(color === 3) {
			url += (48+num);
		}
		return url;
	},
});
