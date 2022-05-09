var model = module.exports;
var NNProto = require('./NNProto');
var RoomProto = require('../../API/RoomProto');


model.setEntryRoomData = function(msg) {
	var data = msg.gameData;
	// 游戏数据,随时可恢复场景
	this.userArr = msg.roomUserInfoArr;
	this.gameRule = data.gameRule;
	this.curBureau = data.curBureau;
	this.roomId = data.roomId;
	this.gameStatus = data.gameStatus;
	this.bankChairId = data.bankChairId;
	this.robBankArr = data.robBankArr;
	this.gameTypeInfo = data.gameTypeInfo;

	this.pourScoreArr = data.pourScoreArr;
	this.canPourScoreArr = data.canPourScoreArr;
	this.cardArr = data.cardArr;
	this.showCardArr = data.showCardArr;
	this.cardsArr = data.cardsArr;
	this.resout = this.resout;
	this.gameStartChairIdArr = data.gameStartChairIdArr;
	this.profitPercentage = data.profitPercentage;

	var i;
	if(! this.showCardArr || this.showCardArr.length === 0) {
		this.showCardArr = [];
		for(i = 0; i < this.gameRule.memberCount; ++i) {
			this.showCardArr[i] = 0; 
		}
	}

	this.myUid = Global.Player.getPy('uid');
	for(i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].userInfo.uid === this.myUid) {
			this.myChairId = this.userArr[i].chairId;
		}
		this.userArr[i].userInfo.nickname = Global.Player.convertNickname(this.userArr[i].userInfo.nickname);
	}

	Global.MessageCallback.addListener('RoomMessagePush', this);
	Global.MessageCallback.addListener('GameMessagePush', this);
};

model.setGameData = function(data) {
	for(var key in data) {
		if(data.hasOwnProperty(key) && this.hasOwnProperty(key)) {
			this[key] = data[key];
		}
	}
};

// 游戏未开始时的数据
model.clearGameData = function() {
	var memberCount = this.gameRule.memberCount;
	this.cardsArr = [];
	this.pourScoreArr = [];
	this.showCardArr = [];
	for(var i = 0; i < memberCount; ++i) {
		this.pourScoreArr[i] = 0;
		this.showCardArr[i] = 0;
		this.cardsArr[i] = [];
	}
};

model.messageCallbackHandler = function(router, msg) {
	if(router === 'RoomMessagePush') {
		if(msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
			this.addPlayer(msg.data.roomUserInfo);
		}
		else if(msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
			this.delPlayer(msg.data.roomUserInfo);
			if(msg.data.roomUserInfo.chairId === this.myChairId) {
				this.onDestroy();
			}
		}
		else if(msg.type === RoomProto.USER_READY_PUSH) {
			this.answerUserReadyPush(msg.data.chairId);
		}
		else if(msg.type === RoomProto.ROOM_DISMISS_PUSH) {
			//this.answerRoomDismissPush(msg.data.reason);
		}
	}
	else if(router === 'GameMessagePush') {
		if(msg.type === NNProto.CAN_POUR_SCORE_PUSH) {
			this.answerCanPourScorePush(msg.data.gameStatus, msg.data.scoresArr);
		}
		else if(msg.type === NNProto.POUR_SCORE_PUSH) {
			this.answerPourScorePush(msg.data.chairId, msg.data.score);
		}
		else if(msg.type === NNProto.SHOW_CARD_PUSH) {
			this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
		}
		else if(msg.type === NNProto.RESOUT_CARD_PUSH) {
			this.answerResoutCardPush(msg.data.chairId, msg.data.cardArr);
		}
		else if(msg.type === NNProto.GAME_RESOUT_PUSH) {
			this.answerGameResoutPush(msg.data.bankIndex, msg.data.cardsArr, msg.data.finalScoreArr);
		}
		else if(msg.type === NNProto.GAME_STATUS_PUSH) {
			this.answerGameStatusPush(msg.data.gameStatus);
		}
		else if(msg.type === NNProto.BANK_CHANGE_PUSH) {
			this.answerBankChangePush(msg.data.bankChairId, msg.data.gameStatus, msg.data.robBankArr);
		}
		else if(msg.type === NNProto.ROB_RATE_BANK_PUSH) {
			this.answerRobRateBank(msg.data.chairId, msg.data.rate);
		}
	}
};


model.answerCanPourScorePush = function(gameStatus, scoresArr) {
	this.clearGameData();
	this.gameStatus = gameStatus;
	this.canPourScoreArr = scoresArr;
};

model.answerPourScorePush = function(chairId, score) {
	this.pourScoreArr[chairId] = score;
};

model.answerShowCardPush = function(chairId, cardArr) {
	var chairIndex = this.getChairIdIndex(chairId);
	this.showCardArr[chairIndex] = true;
	this.cardsArr[chairIndex] = cardArr;
};

model.answerResoutCardPush = function(chairId, cardArr) {
	if(chairId === this.myChairId) {
		this.setMyCardArr(cardArr);
	}
};

model.answerGameResoutPush = function(bankIndex, cardsArr, finalScoreArr) {
	this.bankChairId = this.getChairIdByIndex(bankIndex);
	this.cardsArr = cardsArr;
	++ this.curBureau;
	this.bankChairId = null;
	console.log('answerGameResoutPush');
	console.log(this.gameStartChairIdArr, this.userArr);
	for(var i = 0; i < finalScoreArr.length; ++i) {
		var player = this.getPlayerByChairId(this.gameStartChairIdArr[i]);
		if(finalScoreArr[i] > 0) {
			player.userInfo.gold += finalScoreArr[i]*(1-this.getProfitPercentage());
		} else {
			player.userInfo.gold += finalScoreArr[i];
		}
		if((player.userStatus&RoomProto.userStatusEnum.READY) > 0) {
			player.userStatus -= RoomProto.userStatusEnum.READY;
		}
	}
};

model.answerGameStatusPush = function(gameStatus) {
	this.gameStatus = gameStatus;
	var i;
	if(this.gameStatus === NNProto.GAME_STATUS_ROBBANK) {
		this.gameRule.memberCount = this.gameStartChairIdArr.length;
		for(i = 0; i < this.gameRule.memberCount; ++i) {
			this.robBankArr[i] = -1;
		}
		this.recordGameStartChairId();
	}
	else if(this.gameStatus === NNProto.GAME_STATUS_POURSCORE) {
		this.pourScoreArr = [];
		for(i = 0; i < this.gameRule.memberCount; ++i) {
			this.pourScoreArr[i] = 0;
		}
	}
	else if(this.gameStatus === NNProto.GAME_STATUS_SORTCARD) {
		this.cardsArr = [];
		for(i = 0; i < this.gameRule.memberCount; ++i) {
			this.cardsArr[i] = []; 
		}
	}
};

model.answerBankChangePush = function(bankChairId, gameStatus, robBankArr){
	this.bankChairId = bankChairId;
	this.robBankArr = robBankArr;
	this.answerGameStatusPush(gameStatus);
};

model.answerRobRateBank = function(chairId, rate){
	this.robBankArr[this.getChairIdIndex(chairId)] = rate;
};

model.answerUserReadyPush = function(chairId){
	var player = this.getPlayerByChairId(chairId);
	if(player) {
		player.userStatus |= RoomProto.userStatusEnum.READY;
	}
};

model.answerRoomDismissPush = function(reason){
	this.onDestroy();
};

model.getProfitPercentage = function() {
	return this.profitPercentage/100;
};

model.getRobBankArr = function() {
	return this.robBankArr;
};

model.getCardsArr = function() {
	return this.cardsArr;
};

model.getPourScoreArr = function() {
	return this.pourScoreArr;
};

model.getGameRule = function() {
	return this.gameRule;
};

model.getGameStatus = function() {
	return this.gameStatus;
};

model.getShowCardArr = function() {
	return this.showCardArr;
};

model.getCanPourScoreArr = function() {
	return this.canPourScoreArr;
};

model.onDestroy = function() {
	Global.MessageCallback.removeListener('RoomMessagePush', this);
	Global.MessageCallback.removeListener('GameMessagePush', this);
};

model.getRoomId = function() {
	return this.roomId;
};

model.getBankChairId = function() {
	return this.bankChairId;
};

model.getAllChairId = function() {
	var chairIdArr = [];
	for(var i = 0; i < this.userArr.length; ++i) {
		chairIdArr.push(this.userArr[i].chairId);
	}
	return chairIdArr;
};

model.getCurBureau = function() {
	return this.curBureau;
};

model.getMaxBureau = function() {
	return this.gameRule.bureau;
};

model.getChairCount = function() {
	return 5;
};

model.getMyChairId = function() {
	return this.myChairId;
};

model.getPlayerByChairId = function(chairId) {
	for(var i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].chairId === chairId) {
			return this.userArr[i];
		}
	}
	return null;
};

model.addPlayer = function(player) {
	player.userInfo.nickname = Global.Player.convertNickname(player.userInfo.nickname);
	for(var i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].chairId === player.chairId) {
			this.userArr.splice(i, 1);
		}
	}
	this.userArr.push(player);
};

model.delPlayer = function(player) {
	for(var i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].chairId === player.chairId) {
			this.userArr.splice(i, 1);
		}
	}
};

model.getGameEnd = function() {
	return (!!this.isGameEnd);
};

model.setGameEnd = function() {
	this.isGameEnd = true;
};

model.setMyCardArr = function(cardArr) {
	this.cardArr = cardArr;
};

model.getMyCardArr = function() {
	return this.cardArr;
};

model.recordGameStartChairId = function() {
	this.gameStartChairIdArr = [];
	for(var i = 0; i < 6; ++i) {
		if(this.getPlayerByChairId(i)) {
			this.gameStartChairIdArr.push(i);
		}
	}
};

model.getChairIdIndex = function(chairId) {
	return this.gameStartChairIdArr.indexOf(chairId);
};

model.getChairIdByIndex = function(index) {
	if(index < 0 || index >= this.gameStartChairIdArr.length) {
		return null;
	} else {
		return this.gameStartChairIdArr[index];
	}
};
