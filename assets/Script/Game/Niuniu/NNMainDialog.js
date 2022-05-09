var NNModel = require('./NNModel');
var NNProto = require('./NNProto');
var RoomProto = require('../../API/RoomProto');
var HallApi = require('../../API/HallAPI');
var RoomMessageRouter = 'game.gameHandler.roomMessageNotify';
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';

cc.Class({
    extends: cc.Component,

    properties: {
		cardItem: cc.Prefab,
		headItem: cc.Prefab,
		roomIdLabel: cc.Label,
		pourScoreNode: cc.Node,
		showCardNode: cc.Node,
		rateRobNode: cc.Node,
		audioItem: cc.Prefab,
		stateItem: cc.Prefab,
		resoutNode: cc.Node,
		winSprite: cc.Sprite,
		loseSprite: cc.Sprite,

        continueNode: cc.Node
    },

    onLoad: function () {
		var audioItem = cc.instantiate(this.audioItem);
		audioItem.parent = this.node;
		this.audioManager = audioItem.getComponent('NNAudioNode');
		this.cardItemArr = [];
		this.headItemArr = [];
		var chairCount = NNModel.getChairCount();
		for(var m = 1; m <= chairCount; ++m) {
			this.cardItemArr.push(this.node.getChildByName('NNCardItem'+m));
			this.headItemArr.push(this.node.getChildByName('NNHeadItem'+m)); 
		}
		cc.instantiate(this.stateItem).parent = this.node;
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('ReConnectSuccess', this);
		this.offLineAndClient();
    },

	// 恢复场景
	offLineAndClient: function() {
		var chairCount = NNModel.getChairCount();
		var myChairId = NNModel.getMyChairId();
		var gameRule = NNModel.getGameRule();
		for(var i = 0; i < chairCount; ++i) {
			this.cardItemArr[i].active = false;
			this.headItemArr[i].active = false;
		}
		for(var j = 0; j < chairCount; ++j) {
			if(NNModel.getPlayerByChairId(j)) {
				this.showHeadAndCardByChairId(j);
			} 
		}
		var gameStatus = NNModel.getGameStatus();
		var myChairIndex = NNModel.getChairIdIndex(myChairId);
		if(gameStatus === NNProto.GAME_STATUS_PREPARE) {
			var player = NNModel.getPlayerByChairId(myChairId);

			// 发送游戏准备消息
			Global.API.room.roomMessageNotify(RoomProto.userReadyNotify(true));
		}
		else if(gameStatus === NNProto.GAME_STATUS_POURSCORE) {
			if(myChairId !== NNModel.getBankChairId()) {
				var pourScoreArr = NNModel.getPourScoreArr();
				if(myChairIndex >= 0 && pourScoreArr[myChairIndex] === 0) {
					this.answerCanPourScorePush(gameStatus, NNModel.getCanPourScoreArr(), true);
				}
			}
		}
		else if(gameStatus === NNProto.GAME_STATUS_SORTCARD) {
			this.pourScoreNode.active = false;
			var showCardArr = NNModel.getShowCardArr();
			if(myChairIndex >= 0 && showCardArr[myChairIndex] !== 1) {
				this.showCardNode.active = true;
			}
		}
		else if(gameStatus === NNProto.GAME_STATUS_ROBBANK) {
			var robBankArr = NNModel.getRobBankArr();
			if(myChairIndex >= 0 && robBankArr[myChairIndex] === -1) {
				this.showRateRobButton();
			} else {
				this.rateRobNode.active = false;
			}
		}

		for(var k = 0; k < chairCount; ++k) {
			if(NNModel.getPlayerByChairId(k)) {
				var index = (k+chairCount-myChairId)%chairCount;
				this.headItemArr[index].getComponent('NNHeadItem').offLineAndClient();
				this.cardItemArr[index].getComponent('NNCardItem').offLineAndClient();
			}
		}
	},

	messageCallbackHandler: function(router, msg) {
		var myChairId = NNModel.getMyChairId();
		if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_LEAVE_ROOM_RESPONSE) {
				if(msg.data.chairId === myChairId) {
					Global.DialogManager.removeLoadingCircle();
				}
			}
			else if(msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.showHeadAndCardByChairId(msg.data.roomUserInfo.chairId);
			}
			else if(msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				this.hideHeadItemByChairId(msg.data.roomUserInfo.chairId);
			}
			else if(msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			}
			else if(msg.type === RoomProto.GAME_END_PUSH) {
			}
			else if(msg.type === RoomProto.ROOM_DISMISS_PUSH) {
			}
		}
		else if(router === 'GameMessagePush') {
			if(msg.type === NNProto.CAN_POUR_SCORE_PUSH) {
				this.answerCanPourScorePush(msg.data.gameStatus, msg.data.scoresArr, false);
			}
			else if(msg.type === NNProto.POUR_SCORE_PUSH) {
				this.answerPourScorePush(msg.data.chairId);
			}
			else if(msg.type === NNProto.RESOUT_CARD_PUSH) {
				this.answerResoutCardPush();
			}
			//else if(msg.type === NNProto.FOUR_CARD_PUSH) {
			//	this.answerFourCardPush();
			//}
			else if(msg.type === NNProto.SHOW_CARD_PUSH) {
				this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
			}
			else if(msg.type === NNProto.GAME_RESOUT_PUSH) {
				this.answerGameResoutPush(msg.data.finalScoreArr, msg.data.bankIndex);
			}
			else if(msg.type === NNProto.GAME_STATUS_PUSH) {
				this.answerGameStatusPush(msg.data.gameStatus);
			}
			else if(msg.type === NNProto.ROB_RATE_BANK_PUSH) {
				this.answerRobRateBank(msg.data.chairId);
			}
			else if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
				Global.DialogManager.destroyDialog('Niuniu/NNMainDialog');
				NNModel.setGameData(msg.data.gameData);
				Global.DialogManager.createDialog('Niuniu/NNMainDialog');
			}
		}
		else if(router === 'ReConnectSuccess') {
			//Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
			if(Global.Player.isInRoom()) {
				Global.API.hall.joinRoomRequest(NNModel.getRoomId(), function() {
					Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
				}, function () {
					this.exitGame();
                }.bind(this));
			} else {
				/*Global.DialogManager.addPopDialog('当前房间已解散！', function () {
					Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
						Global.DialogManager.destroyDialog('Niuniu/NNMainDialog');
					});
				});*/
				this.exitGame();
			}
		}
	},

	answerCanPourScorePush: function(gameStatus, scoresArr, isOffLine) {
		var gameRule = NNModel.getGameRule();
		var robBankArr = NNModel.getRobBankArr();
		var myChairIndex = NNModel.getChairIdIndex(NNModel.getMyChairId());
		var robCount;
		for(var j = 4; j >= 0; --j) {
			robCount = 0;
			for(var i = 0; i < robBankArr.length; ++i) {
				if(robBankArr[i] === j) { ++ robCount; }
			}
			if(robCount > 0) { break; }
		}
		if(robCount === 1) {
			this.pourScoreNode.active = true;
		} else {
			var delay = 4*robCount*0.1;
			for(var k = 0; k <= NNModel.getBankChairId(); ++k) {
				if(robBankArr[k] === j) { delay += 0.1; }
			}
			this.scheduleOnce(function() {
				this.pourScoreNode.active = true;
			}.bind(this), delay);
		}
	},

	answerPourScorePush: function(chairId) {
		if(chairId === NNModel.getMyChairId()) {
			this.pourScoreNode.active = false;
		}
	},

	answerResoutCardPush: function() {
		this.scheduleOnce(function() {
			this.showCardNode.active = true;
		}.bind(this), 2);
	},

	answerFourCardPush: function() {
		var myChairIndex = NNModel.getChairIdIndex(NNModel.getMyChairId());
	},

	answerGameResoutPush: function(finalScoreArr, bankIndex) {
		var gameRule = NNModel.getGameRule();
		var posArr = [];
		for(var m = 0; m < this.headItemArr.length; ++m) {
			var pos = this.headItemArr[m].getPosition();
			posArr.push({ x: pos.x, y: pos.y });
		}
		var myChairId = NNModel.getMyChairId();
		var myChairIndex = NNModel.getChairIdIndex(myChairId);
		var bankChairId = NNModel.getChairIdByIndex(bankIndex);
		var chairCount = NNModel.getChairCount();

		var self = this;
		var callFunc = function() {
			for(var i = 0; i < finalScoreArr.length; ++i) {
				if(i !== bankIndex) {
					if(finalScoreArr[i] > 0) {
						var sPos = posArr[(bankChairId+chairCount-myChairId)%chairCount];
						var ePos = posArr[(NNModel.getChairIdByIndex(i)+chairCount-myChairId)%chairCount];
						self.playGoldAnimal(self.node, sPos, ePos);
					}
				}
			}
		};
		for(var i = 0; i < finalScoreArr.length; ++i) {
			if(i !== bankIndex) {
				if(finalScoreArr[i] < 0) {
					var sPos = posArr[(NNModel.getChairIdByIndex(i)+chairCount-myChairId)%chairCount];
					var ePos = posArr[(bankChairId+chairCount-myChairId)%chairCount];
					this.playGoldAnimal(this.node, sPos, ePos);
				}
			}
		}
		this.scheduleOnce(callFunc, 0.65);
		if(myChairIndex >= 0) {
			this.resoutNode.active = true;
			var myScore = finalScoreArr[myChairIndex];
			if(myScore >= 0) {
				this.winSprite.node.active = true;
				this.loseSprite.node.active = false;
				Global.AudioManager.playSound('GameCommon/Sound/win_game');
			} else {
				this.winSprite.node.active = false;
				this.loseSprite.node.active = true;
				Global.AudioManager.playSound('Niuniu/Audio/losegame');
			}
			this.resoutNode.setScale(0.01);
			this.resoutNode.runAction(cc.sequence(
				cc.scaleTo(0.2, 1.2, 1.2),
				cc.scaleTo(0.1, 1.0, 1.0),
				cc.delayTime(4),
				cc.callFunc(function() {
					this.resoutNode.active = false;
					this.continueNode.active = true;
				}.bind(this))
			));
		}
	},

	answerShowCardPush: function(chairId, cardArr) {
		if(chairId === NNModel.getMyChairId()) {
			this.showCardNode.active = false;
		}
	},

	answerGameStatusPush: function(gameStatus) {
		if(gameStatus === NNProto.GAME_STATUS_PREPARE) {
		}
		else if(gameStatus === NNProto.GAME_STATUS_POURSCORE) {
		}
		else if(gameStatus === NNProto.GAME_STATUS_ROBBANK) {
			var gameRule = NNModel.getGameRule();
			this.showRateRobButton();
		}
		else if(gameStatus === NNProto.GAME_STATUS_SORTCARD) {
			this.pourScoreNode.active = false;
		}
	},

	answerRobRateBank: function(chairId) {
		if(chairId === NNModel.getMyChairId()) {
			this.rateRobNode.active = false;
		}
	},

	answerUserReadyPush: function(chairId) {
		if(chairId === NNModel.getMyChairId()) {
			if(this.autoExitCall) {
				this.unschedule(this.autoExitCall);
			}
		}
	},

	showRateRobButton: function() {
		this.rateRobNode.active = true;
		//var maxRate = NNModel.getGameRule().otherRule.qiangzhuang;
		//for(var i = maxRate+1; i <= 4; ++i) {
		//	this.rateRobNode.getChildByName('RobButton'+i).active = false;
		//}
		//this.rateRobNode.x = (4-maxRate)*112/2;
	},

	onButtonClick: function(event, param) {
		if(param === 'dismiss') {
			Global.DialogManager.addPopDialog('确认退出游戏?', function() {
				if (Global.Player.roomID){
                    Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getAskForDismissNotifyData());
                    Global.DialogManager.addLoadingCircle();
				}else{
				    this.exitGame();
				}
			}.bind(this), function() {});
		}
		else if(param === 'setting') {
			var self = this;
            Global.DialogManager.createDialog('Setting/SettingDialog', {
				callback: self.audioManager.setVolume.bind(self.audioManager)
			});
		}
		else if(param === 'rule') {
			Global.DialogManager.createDialog('GameCommon/GameRule/GameRuleDialog', {kind: Global.Enum.gameType.NN});
		}
		else if(param === 'ready') {
			Global.NetworkManager.notify(RoomMessageRouter, RoomProto.userReadyNotify(true));
		}
		else if(param === 'free_rob') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobFreeBankNotifyData(true));
		}
		else if(param === 'free_no_rob') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobFreeBankNotifyData(false));
		}
		else if(param === 'rate_no_rob') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobRateBankNotifyData(0));
		}
		else if(param === 'rob_1') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobRateBankNotifyData(1));
		}
		else if(param === 'rob_2') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobRateBankNotifyData(2));
		}
		else if(param === 'rob_4') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobRateBankNotifyData(4));
		}
		else if(param === 'pour_1') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getPourScoreNotifyData(5));
		}
		else if(param === 'pour_2') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getPourScoreNotifyData(10));
		}
		else if(param === 'pour_3') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getPourScoreNotifyData(15));
		}
		else if(param === 'pour_4') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getPourScoreNotifyData(20));
		}
		else if(param === 'show_card') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getShowCardNotifyData());
		}else if (param === 'continue'){
            Global.DialogManager.createDialog("Match/MatchGameDialog", {gameTypeID: NNModel.gameTypeInfo.gameTypeID});
        }
	},

	showHeadAndCardByChairId: function(chairId) {
		var myChairId = NNModel.getMyChairId();
		var chairCount = NNModel.getChairCount();
		var index = (chairId+chairCount-myChairId)%chairCount;
		this.headItemArr[index].active = true;
		this.cardItemArr[index].active = true;
		var headMgr = this.headItemArr[index].getComponent('NNHeadItem');
		var cardMgr = this.cardItemArr[index].getComponent('NNCardItem');
		var pos;
		if(chairCount === 4) {
			pos = ['bottom', 'right', 'top', 'left'][index];
		} else {
			pos = ['bottom', 'right', 'right', 'top', 'left', 'left'][index];
		}
		headMgr.setHeadPosAndChairId(pos, chairId);
		cardMgr.setCardPosAndChairId(pos, chairId);
	},

	hideHeadItemByChairId: function(chairId) {
		var myChairId = NNModel.getMyChairId();
		var chairCount = NNModel.getChairCount();
		var index = (chairId+chairCount-myChairId)%chairCount;
		this.headItemArr[index].active = false;
		this.cardItemArr[index].active = false;
		if(chairId === myChairId) {
			//Global.Player.setPy('roomID', null);
			/*Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
				Global.DialogManager.removeLoadingCircle();
				Global.DialogManager.destroyDialog('Niuniu/NNMainDialog');
			});*/
			this.exitGame();
		}
	},

	exitGame: function () {
        NNModel.onDestroy();
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.removeLoadingCircle();
            Global.DialogManager.destroyDialog('Niuniu/NNMainDialog', true);
            Global.CCHelper.releaseRes(['NiuNiu']);
        });
    },

	// 发牌动画
	playSendCardAnimal: function(cardsNode) {
		cardsNode.active = true;
		var pos = cardsNode.getPosition();
		var cardNodeArr = [];
		var cardNodePosArr = [];
		var cardNode, cardPos, bezierArr;
		var startPos, endPos;
		for(var i = 1; i <= 5; ++i) {
			cardNode = cardsNode.getChildByName('CardSprite'+i);
			cardNode.active = true;
			cardPos = cardNode.getPosition();
			cardNodeArr.push(cardNode);
			cardNodePosArr.push(cardPos);
			startPos = cc.v2(-cardPos.x-pos.x, -cardPos.y-pos.y);
			endPos = cardPos;
			cardNode.setPosition(startPos);
			cardNode.runAction(cc.bezierTo(1, this.getBezierPosArr(startPos, endPos)));
		}
	},

	getBezierPosArr: function(startPos, endPos) {
		var midPos = cc.v2((startPos.x+endPos.x)/2, (startPos.y+endPos.y)/2);
		return [startPos, midPos, endPos];
	},

	playGoldAnimal: function(pNode, sPos, ePos, cb) {
		var nodeArr = [];
		var goldCount = 10;
		var offPos = [{x: -3, y: 3}, {x: 3, y: 3}, {x: 0, y: -3}];
		for(var i = 0; i < goldCount; ++i) {
			nodeArr.push(new cc.Node());
			Global.CCHelper.updateSpriteFrame('Niuniu/Common/nn_gold', nodeArr[i].addComponent(cc.Sprite));
			nodeArr[i].parent = pNode;
			var pos = cc.v2(sPos.x+offPos[i%3].x, sPos.y+offPos[i%3].y);
			nodeArr[i].setPosition(pos);
		}
		i = 0;
		//var delay = Math.sqrt((sPos.x-ePos.x)*(sPos.x-ePos.x)+(sPos.y-ePos.y)*(sPos.y-ePos.y))/1500;
		var delay = 0.5;
		var self = this;
		var callFunc = function() {
			if(i < goldCount) {
				nodeArr[i].active = true;
				var pos = cc.v2(ePos.x+offPos[i%3].x, ePos.y+offPos[i%3].y);
				nodeArr[i].runAction(cc.moveTo(delay-i*0.03, pos));
				Global.AudioManager.playSound('GameCommon/Sound/win_bet');
				++i;
			} else {
				self.unschedule(callFunc);
			}
		};
		this.schedule(callFunc, 0.03);
		this.scheduleOnce(function() {
			for(i = 0; i < goldCount; ++i) {
				nodeArr[i].removeFromParent();
			}
			if(cb) {
				cb();
			}
		}, delay+0.15);
	},

	getHeadItemByChairId: function(chairId) {
		var myChairId = NNModel.getMyChairId();
		var chairCount = NNModel.getChairCount();
		var index = (chairId+chairCount-myChairId)%chairCount;
		return this.headItemArr[index];
	},

	onDestroy: function() {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
		Global.MessageCallback.removeListener('ReConnectSuccess', this);
	},

	getAudioManager: function() {
		return this.audioManager;
	},
});
