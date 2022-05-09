var NNModel = require('NNModel');
var NNProto = require('./NNProto');
var RoomProto = require('../../API/RoomProto');

cc.Class({
    extends: cc.Component,

    properties: {
		nameLabel: cc.Label,
		headSprite: cc.Sprite,
		bankSprite: cc.Sprite,
		scoreLabel: cc.Label,
		winScoreLabel: cc.Label,
		loseScoreLabel: cc.Label,
		robRateNode: cc.Node,
		pourScoreLabel: cc.Label,
		headEdgSprite: cc.Sprite,
    },


	onLoad: function() {
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
	},

	offLineAndClient: function() {
		var gameStatus = NNModel.getGameStatus();
		this.bankSprite.node.active = false;
		this.scoreLabel.string = NNModel.getPlayerByChairId(this.chairId).userInfo.gold.toFixed(2);

		this.pourScoreLabel.string = '';
		this.winScoreLabel.string = '';
		this.loseScoreLabel.string = '';
		this.bankSprite.node.active = false;
		this.robRateNode.active = false;

		var chairIndex = NNModel.getChairIdIndex(this.chairId);
		if(gameStatus === NNProto.GAME_STATUS_ROBBANK) {
			var robBankArr = NNModel.getRobBankArr();
			if(robBankArr[this.chairId] !== -1) {
				this.answerRobRateBank(this.chairId, robBankArr[this.chairId]);
			}
		}
		else if(gameStatus === NNProto.GAME_STATUS_POURSCORE || gameStatus === NNProto.GAME_STATUS_SORTCARD) {
			if(chairIndex >= 0) {
				var pourScore = NNModel.getPourScoreArr()[chairIndex];
				if(pourScore !== 0) {
					this.pourScoreLabel.string = pourScore+'倍';
					this.pourScoreLabel.node.active = true;
				}
				this.showRateSprite(NNModel.getRobBankArr());
			}
		}
		else if(gameStatus === NNProto.GAME_STATUS_RESOUT) {
			if(chairIndex >= 0) {
				this.showRateSprite(NNModel.getRobBankArr());
			}
		}
		if(NNModel.getBankChairId() === this.chairId) {
			this.bankSprite.node.active = true;
		}
	},

	messageCallbackHandler: function(router, msg) {
		if(! this.pos) { return; }
		if(router === 'GameMessagePush') {
			if(msg.type === NNProto.POUR_SCORE_PUSH) {
				this.answerPourScorePush(msg.data.chairId, msg.data.score);
			}
			else if(msg.type === NNProto.CAN_POUR_SCORE_PUSH) {
			}
			else if(msg.type === NNProto.GAME_RESOUT_PUSH) {
				if(NNModel.getChairIdIndex(this.chairId) >= 0) {
					this.answerGameResoutPush(msg.data.finalScoreArr, msg.data.bankIndex);
				}
			}
			else if(msg.type === NNProto.GAME_STATUS_PUSH) {
				if(msg.data.gameStatus === NNProto.GAME_STATUS_PREPARE) {
					this.answerUserReadyPush(this.chairId);
				}
			}
			else if(msg.type === NNProto.ROB_FREE_BANK_PUSH) {
			}
			else if(msg.type === NNProto.ROB_RATE_BANK_PUSH) {
				this.answerRobRateBank(msg.data.chairId, msg.data.rate);
			}
			else if(msg.type === NNProto.BANK_CHANGE_PUSH) {
				this.answerBankChangePush(msg.data.bankChairId, msg.data.robBankArr);
			}
		}
		else if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			}
			else if(msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				this.answerUserLeavePush(msg.data.roomUserInfo.chairId);
			}
		}
	},

	answerPourScorePush: function(chairId, score) {
		if(chairId === this.chairId) {
			this.pourScoreLabel.string = score+'倍';
			this.pourScoreLabel.node.active = true;
			this.robRateNode.active = false;
		}
	},

	answerGameResoutPush: function(scoreArr, bankIndex) {
		var font = 'Font/fnt_game2';
		var score = scoreArr[NNModel.getChairIdIndex(this.chairId)];
		var profitPercentage = NNModel.getProfitPercentage();
		if(score < 0) {
			this.loseScoreLabel.string = score.toFixed(2);
		} else {
			this.winScoreLabel.string = '+' + (score*(1-NNModel.getProfitPercentage())).toFixed(2);
		}
		var self = this;
		var bankChairId = NNModel.getChairIdByIndex(bankIndex);
		if(bankChairId === this.chairId) {
			this.bankSprite.node.active = true;
		} else {
			this.bankSprite.node.active = false;
		}
		this.scheduleOnce(function() {
			self.scoreLabel.string = NNModel.getPlayerByChairId(self.chairId).userInfo.gold.toFixed(2);
		}, 3);
	},

	answerRobRateBank: function(chairId, rate) {
		if(chairId === this.chairId) {
			this.robRateNode.active = true;
			if(rate === 0) {
				this.robRateNode.getChildByName('BuqiangSprite').active = true;
				this.robRateNode.getChildByName('QiangSprite').active = false;
				this.robRateNode.getChildByName('RateLabel').active = false;
			} else {
				this.robRateNode.getChildByName('BuqiangSprite').active = false;
				this.robRateNode.getChildByName('QiangSprite').active = true;
				this.robRateNode.getChildByName('RateLabel').active = true;
				this.robRateNode.getChildByName('RateLabel').getComponent(cc.Label).string = rate;
			}
		}
	},

	answerBankChangePush: function(bankChairId, robBankArr) {
		var gameRule = NNModel.getGameRule();
		var memberCount = 5;
		var rateArr = [ 0, 1, 2, 4];
		var j, i;
		for(j = rateArr.length-1; j >= 0; --j) {
			var robCount = 0;
			for(i = 0; i < robBankArr.length; ++i) {
				if(robBankArr[i] === rateArr[j]) { ++ robCount; }
			}
			if(robCount > 0) {
				if(robCount === 1) {
					this.bankSprite.node.active = (this.chairId === bankChairId);
					this.showRateSprite(robBankArr);
					return;
				}
				break;
			}
		}
		var bankIndex = NNModel.getChairIdIndex(bankChairId);
		var chairIndex = NNModel.getChairIdIndex(this.chairId);
		var rate = rateArr[j];
		if(robBankArr[chairIndex] < rate) { return; }		/*此玩家不抢庄*/ 
		var index = 0;
		var self = this;
		var callback = function() {
			while(NNModel.getChairIdIndex(index%memberCount) < 0 || robBankArr[NNModel.getChairIdIndex(index%memberCount)] < rate) {
				++ index;
			}
			self.headEdgSprite.node.active = (index%memberCount === self.chairId);
			if(index >= memberCount*4+bankChairId) {
				self.bankSprite.node.active = (bankChairId === self.chairId);
				self.headEdgSprite.node.active = false;
				self.showRateSprite(robBankArr);
				self.unschedule(callback);
			}
			++index;
		};
		this.schedule(callback, 0.1);
	},

	answerUserReadyPush: function(chairId) {
		var myChairId = NNModel.getMyChairId();
		if(chairId === myChairId) {
			this.pourScoreLabel.string = '';
			this.winScoreLabel.string = '';
			this.loseScoreLabel.string = '';
			this.bankSprite.node.active = false;
			this.robRateNode.active = false;
		}
	},

	answerUserLeavePush: function(chairId) {
		if(chairId === this.chairId) {
			this.pourScoreLabel.string = '';
			this.winScoreLabel.string = '';
			this.loseScoreLabel.string = '';
			this.bankSprite.node.active = false;
			this.robRateNode.active = false;
		}
	},

	showRateSprite: function(robBankArr) {
		if(this.chairId !== NNModel.getBankChairId()) {
			this.robRateNode.active = false;
			return;
		}
		var index = NNModel.getChairIdIndex(this.chairId);
		var rate = robBankArr[index];
		if(rate <= 0) { rate = 1; }
		this.robRateNode.active = true;
		this.robRateNode.getChildByName('BuqiangSprite').active = false;
		this.robRateNode.getChildByName('QiangSprite').active = true;
		this.robRateNode.getChildByName('RateLabel').getComponent(cc.Label).string = rate;
		this.robRateNode.getChildByName('RateLabel').active = true;
	},

	setHeadPosAndChairId: function(pos, chairId) {
		this.pos = pos;
		this.chairId = chairId;
		var player = NNModel.getPlayerByChairId(chairId);
		if(player) {
			this.nameLabel.string = player.userInfo.nickname;
			this.scoreLabel.string = player.userInfo.gold.toFixed(2);
			Global.CCHelper.updateSpriteFrame(player.userInfo.avatar, this.headSprite);
		}
		if(this.chairId === NNModel.getBankChairId()) {
			this.bankSprite.node.active = true;
		}
	},

	onDestroy: function() {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	}
});

