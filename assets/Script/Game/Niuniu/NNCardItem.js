var NNProto = require('./NNProto');
var RoomProto = require('../../API/RoomProto');
var NNLogic = require('./NNLogic');
var NNModel = require('./NNModel');

cc.Class({
    extends: cc.Component,

    properties: {
		cardsNode: cc.Node,
		cardSprite1: cc.Sprite,
		cardSprite2: cc.Sprite,
		cardSprite3: cc.Sprite,
		cardSprite4: cc.Sprite,
		cardSprite5: cc.Sprite,
		typeSprite: cc.Sprite
    },

    onLoad: function () {
		this.audioManager = this.node.parent.getComponent('NNMainDialog').getAudioManager();
		this.cardsNode.active = false;
		this.cardSpriteArr = [this.cardSprite1, this.cardSprite2, this.cardSprite3, this.cardSprite4, this.cardSprite5];
		this.cardPosArr = [];
		for(var i = 0; i < this.cardSpriteArr.length; ++i) {
			this.cardPosArr.push(this.cardSpriteArr[i].node.getPosition());
		}
		this.typeSprite.node.active = false;
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
    },

	offLineAndClient: function() {
		var gameStatus = NNModel.getGameStatus();
		var chairIndex = NNModel.getChairIdIndex(this.chairId);
		var cardArr, i;
		if(chairIndex < 0) { return; }
		var posArr = [cc.v2(-132, 0), cc.v2(-66, 0), cc.v2(0, 0), cc.v2(66, 0), cc.v2(132, 0)];
		if(gameStatus === NNProto.GAME_STATUS_ROBBANK || gameStatus === NNProto.GAME_STATUS_POURSCORE) {
			this.cardsNode.active = false;
		}
		else if(gameStatus === NNProto.GAME_STATUS_SORTCARD) {
			var showCardArr = NNModel.getShowCardArr();
			this.cardsNode.active = true;
			if(showCardArr[chairIndex] === 1) {
				cardArr = NNModel.getCardsArr()[chairIndex];
				for(i = 0; i < 5; ++i) {
					Global.CCHelper.updateSpriteFrame(this.getCardUrl(cardArr[i]), this.cardSpriteArr[i]);
				}
				this.typeSprite.node.active = true;
				var rateUrl = this.getTypeSpriteUrl(cardArr);
				Global.CCHelper.updateSpriteFrame(rateUrl, this.typeSprite);

				if(this.chairId === NNModel.getMyChairId()) {
					this.node.setPosition(0, -119);
					this.node.setScale(0.7, 0.7);
					for(i = 0; i < this.cardSpriteArr.length; ++i) {
						this.cardSpriteArr[i].node.setPosition(posArr[i]);
					}
				}
			} 
			else {
				if(this.chairId === NNModel.getMyChairId()) {
					this.cardArr = NNModel.getCardsArr()[chairIndex];
					this.node.getChildByName('CountNode').active = true;
					for(i = 0; i < 5; ++i) {
						Global.CCHelper.updateSpriteFrame(this.getCardUrl(this.cardArr[i]), this.cardSpriteArr[i]);
						this.setCardClickFunc(i);
					}
				} else {
					for(i = 0; i < 5; ++i) {
						Global.CCHelper.updateSpriteFrame('GameCommon/Card/card_back', this.cardSpriteArr[i]);
					}
				}
			}
		}
		else if(gameStatus === NNProto.GAME_STATUS_RESOUT) {
			cardArr = NNModel.getCardsArr()[chairIndex];
			if(this.chairId === NNModel.getMyChairId()) {
				this.answerShowCardPush(this.chairId, cardArr);
			} else {
				this.showAllCardAndType(cardArr);
			}
		}
	},

	messageCallbackHandler: function(router, msg) {
		if(! this.pos) {	return; }
		var myChairId = NNModel.getMyChairId();
		if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			}
			else if(msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				this.answerUserLeavePush(msg.data.roomUserInfo.chairId);
			}
		}
		else if(router === 'GameMessagePush') {
			if(NNModel.getChairIdIndex(this.chairId) < 0) { return; }
			if(msg.type === NNProto.RESOUT_CARD_PUSH) {
				this.answerResoutCardPush(msg.data.chairId, msg.data.cardArr);
			}
			else if(msg.type === NNProto.GAME_RESOUT_PUSH) {
				this.answerResoutPush(msg.data.cardsArr);
			}
			else if(msg.type === NNProto.SHOW_CARD_PUSH) {
				this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
			}
			else if(msg.type === NNProto.GAME_STATUS_PUSH) {
				if(msg.data.gameStatus === NNProto.GAME_STATUS_PREPARE) {
					this.scheduleOnce(function() {
						this.answerUserReadyPush(this.chairId);
					}.bind(this), NNProto.AUTO_READY_TM-4);
				}
			}
		}
	},

	answerUserReadyPush: function(chairId) {
		if(chairId === this.chairId) {
			this.cardsNode.active = false;
			this.typeSprite.node.active = false;
			for(var i = 0; i < this.cardSpriteArr.length; ++i) {
				this.cardSpriteArr[i].node.setPosition(this.cardPosArr[i]);
			}
			if(chairId === NNModel.getMyChairId()) {
				this.node.setScale(1, 1);
				this.node.setPosition(0, -212);
			}
		}
	},

	answerUserLeavePush: function(chairId) {
		if(chairId === this.chairId) {
			this.cardsNode.active = false;
			this.typeSprite.node.active = false;
		}
	},

	answerResoutCardPush: function(chairId, cardArr) {
		if(chairId === this.chairId && chairId === NNModel.getMyChairId()) {
			this.cardArr = cardArr;
		} else {
			this.cardArr = [0, 0, 0, 0, 0];
		}
		this.sendCard();
	},

	answerResoutPush: function(cardsArr) {
		var chairIndex = NNModel.getChairIdIndex(this.chairId);
		if(chairIndex >= 0 && cardsArr[chairIndex]) {
			this.showAllCardAndType(cardsArr[chairIndex]);
			if(this.chairId === NNModel.getMyChairId()) {
				this.node.getChildByName('CountNode').active = false;
				for(var i = 0; i < 5; ++i) {
					this.cardSpriteArr[i].node.targetOff(this.node);
				}
			}
		}
	},

	answerShowCardPush: function(chairId, cardArr) {
		var myChairId = NNModel.getMyChairId();
		if(chairId === myChairId && chairId === this.chairId) {
			this.node.setPosition(0, -119);
			this.node.setScale(0.7, 0.7);
			var posArr = [cc.v2(-132, 0), cc.v2(-66, 0), cc.v2(0, 0), cc.v2(66, 0), cc.v2(132, 0)];
			for(var i = 0; i < this.cardSpriteArr.length; ++i) {
				this.cardSpriteArr[i].node.setPosition(posArr[i]);
			}
			this.node.getChildByName('CountNode').active = false;
		}
		if(chairId === this.chairId) {
			this.showAllCardAndType(cardArr);
		}
	},

	showAllCardAndType: function(cardArr) {
		this.cardsNode.active = true;
		for(var i = 0; i < 5; ++i) {
			Global.CCHelper.updateSpriteFrame(this.getCardUrl(cardArr[i]), this.cardSpriteArr[i]);
		}
		this.typeSprite.node.active = true;
		var rateUrl = this.getTypeSpriteUrl(cardArr);
		Global.CCHelper.updateSpriteFrame(rateUrl, this.typeSprite);
		var rate = NNLogic.getSpecialCardTypeRate(cardArr);
		if(rate !== 0) {
			if(rate === NNLogic.RATE_WUHUA) {
				this.audioManager.playWuhuaniu();
			}
			else if(rate === NNLogic.RATE_ZHADAN) {
				this.audioManager.playZhadanniu();
			}
		} else {
			rate = NNLogic.getNormalCardType(cardArr);
			this.audioManager.playNiuType(rate);
		}
	},

	/*
	 * 发牌特效
	 */
	sendCard: function() {
		this.cardsNode.active = true;
		var cardItemPos = this.node.getPosition();
		var cardNode, cardsPosArr = [];
		for(var i = 0; i < 5; ++i) {
			cardNode = this.cardSpriteArr[i].node;
			cardsPosArr.push(cardNode.getPosition());
			cardNode.active = false;
			Global.CCHelper.updateSpriteFrame('GameCommon/Card/card_back', this.cardSpriteArr[i]);
		}

		var index = 0;
		var self = this;
		var callFunc = function() {
			var node;
			if(index < 5) {
				node= self.cardSpriteArr[index%5].node;
				node.active = true;
				var endPos = cardsPosArr[0];
				var startPos = cc.v2(-cardItemPos.x/self.node.scaleX, -cardItemPos.y/self.node.scaleX);
				node.setPosition(startPos);
				node.runAction(cc.bezierTo(0.5, self.getBezierPosArr(startPos, endPos)));
			}
			if(index >= 6) { 
				node= self.cardSpriteArr[(index-1)%5].node;
				node.runAction(cc.moveTo(0.1, cardsPosArr[(index-1)%5]));
			}
			++ index;
			if(index >= 11) {
				for(var i = 1; i <= 5; ++i) {
					self.cardSpriteArr[i-1].node.zIndex = i;
				}
				self.unschedule(callFunc); 
				self.showMyCard();
			}
		};
		this.schedule(callFunc, 0.1);
	},

	/*
	 * 显示牌
	 */
	showMyCard: function() {
		if(this.chairId === NNModel.getMyChairId()) {
			for(var i = 0; i < 5; ++i) {
				this.flipCard(this.cardSpriteArr[i], this.getCardUrl(this.cardArr[i]));
			}
			for(i = 0; i < 5; ++i) {
				this.setCardClickFunc(i);
			}
		}
	},

	/*
	 * 翻牌效果
	 */
	flipCard: function(cardSprite, url) {
		var countNode = this.node.getChildByName('CountNode');
		countNode.active = true;
		var i;
		for(i = 1; i <= 4; ++i) {
			countNode.getChildByName('Label'+i).getComponent(cc.Label).string = '';
		}
		var node = cardSprite.node;
		node.runAction(cc.sequence(
			cc.scaleTo(0.1, 0, 1),
			cc.callFunc(function() {
				Global.CCHelper.updateSpriteFrame(url, cardSprite);
			}),
			cc.scaleTo(0.1, 1, 1)
		));
	},

	/*
	 * 点击牌进行计算
	 */
	setCardClickFunc: function(index) {
		var countNode = this.node.getChildByName('CountNode');
		var label1 = countNode.getChildByName('Label1').getComponent(cc.Label);
		var label2 = countNode.getChildByName('Label2').getComponent(cc.Label);
		var label3 = countNode.getChildByName('Label3').getComponent(cc.Label);
		var label4 = countNode.getChildByName('Label4').getComponent(cc.Label);
		var self = this;
		this.cardSpriteArr[index].node.targetOff(this.node);
        this.cardSpriteArr[index].node.y = this.cardSpriteArr[0].node.y;
		var posY = this.cardSpriteArr[index].node.y;
		this.cardSpriteArr[index].node.on(cc.Node.EventType.TOUCH_END, function() {
		    // 如果点击了已选择的牌，则直接取消选择
		    if (Math.abs(self.cardSpriteArr[index].node.y - posY) > 5){
                label1.string = '';
                label2.string = '';
                label3.string = '';
                label4.string = '';
                for(var i = 0; i < 5; ++i) {
                    self.cardSpriteArr[i].node.y = posY;
                }
                return;
            }
			if(label1.string === '') {
				label1.string = NNLogic.getCardCount(self.cardArr[index]);
				self.cardSpriteArr[index].node.y = posY+20;
			}
			else if(label2.string === '') {
				label2.string = NNLogic.getCardCount(self.cardArr[index]);
				self.cardSpriteArr[index].node.y = posY+20;
			}
			else if(label3.string === '') {
				label3.string = NNLogic.getCardCount(self.cardArr[index]);
				self.cardSpriteArr[index].node.y = posY+20;
				var count = 0;
				if(parseInt(label1.string) < 10) {
					count += parseInt(label1.string);
				} else {
					count += 10;
				}
				if(parseInt(label2.string) < 10) {
					count += parseInt(label2.string);
				} else {
					count += 10;
				}
				if(parseInt(label3.string) < 10) {
					count += parseInt(label3.string);
				} else {
					count += 10;
				}
				label4.string = count;
			}
			else if(label4.string !== '') {
				label1.string = '';
				label2.string = '';
				label3.string = '';
				label4.string = '';
				for(var i = 0; i < 5; ++i) {
					self.cardSpriteArr[i].node.y = posY;
				}
			}

		}, this.node);
	},

	getBezierPosArr: function(startPos, endPos) {
		var midPos = cc.v2((startPos.x+endPos.x)/2, (startPos.y+endPos.y)/2+300);
		return [startPos, midPos, endPos];
	},

	setCardPosAndChairId: function(pos, chairId) {
		this.pos = pos;
		this.chairId = chairId;
	},

	/*
	 * 获取类型对应图片url
	 */
	getTypeSpriteUrl: function(cardArr) {
		var gameRule = NNModel.getGameRule();
		var rate = NNLogic.getSpecialCardTypeRate(cardArr);
		if(rate === NNLogic.RATE_WUHUA) {
			return 'Niuniu/NNType/nn_five_flower';
		}
		else if(rate === NNLogic.RATE_ZHADAN) {
			return 'Niuniu/NNType/nn_four_bull';
		} else {
			return 'Niuniu/NNType/niu_'+NNLogic.getNormalCardType(cardArr);
		}
	},

	/*
	 * 获取牌对应的图片url
	 */
	getCardUrl: function(cardId) {
		var num = NNLogic.getCardNumber(cardId);
		var color = NNLogic.getCardColor(cardId);
		var url = 'GameCommon/Card/';
		if(color === NNLogic.COLOR_FANGKUAI) {
			url += num;
		}
		else if(color === NNLogic.COLOR_CAOHUA) {
			url += (16+num);
		}
		else if(color === NNLogic.COLOR_HONGTAO) {
			url += (32+num);
		}
		else if(color === NNLogic.COLOR_HEITAO) {
			url += (48+num);
		}
		return url;
	},

	onDestroy: function() {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},
});
