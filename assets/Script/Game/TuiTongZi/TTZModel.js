var model = module.exports;
var TTZProto = require('./TTZProto');
var RoomProto = require('../../API/RoomProto');

model.setEntryRoomData = function(msg) {
	console.log('setEntryRoomData', msg);
	var data = msg.gameData;
	this.userArr = msg.roomUserInfoArr || this.userArr;
	this.bankerUid = data.bankerUid;
	this.bureau = data.bureau;
	this.maxBureau = data.maxBureau;
	this.gameStatus = data.gameStatus;
	this.pourPool = data.pourPool;
	this.bankerPool = data.bankerPool;
	this.touzi1 = data.touzi1;
	this.touzi2 = data.touzi2;
	this.bankGold = data.bankGold;
	this.dirRecord = data.dirRecord;
	this.resout = data.resout;
	this.profitPercentage = data.profitPercentage;
	this.roomId = data.roomId;

	this.myUid = Global.Player.getPy('uid');
	for(var i = 0; i < this.userArr.length; ++i) {
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

model.onDestroy = function() {
	Global.MessageCallback.removeListener('RoomMessagePush', this);
	Global.MessageCallback.removeListener('GameMessagePush', this);
};

model.messageCallbackHandler = function(router, msg) {
	if(router === 'RoomMessagePush') {
		if(msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
			this.addUser(msg.data.roomUserInfo);
		}
		else if(msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
			this.delUser(msg.data.roomUserInfo);
		}
	}
	else if(router === 'GameMessagePush') {
		if(msg.type === TTZProto.GAME_ASKTOBEBANKER_PUSH) {		// 请求上庄推送
			this.answerTobeBanker(msg.data.bankerUid, msg.data.bankGold);
		}
		else if(msg.type === TTZProto.GAME_BANKERCHANGE_PUSH) {	// 庄家推送
			this.answerBankerChange(msg.data.bankerUid, msg.data.bankGold);
		}
		else if(msg.type === TTZProto.GAME_CONTINUEBANKER_PUSH) {	// 须庄推送
			this.answerContinueBanker(msg.data.bankerUid, msg.data.bankGold);
		}
		else if(msg.type === TTZProto.GAME_STATUSCHANGE_PUSH) {
			this.gameStatus = msg.data.gameStatus;
			if(this.gameStatus === TTZProto.GAME_STATUS_SETTLE) {		// 结算中
				this.gameEndClearData();
			}
		}
		else if(msg.type === TTZProto.GAME_POURGOLD_PUSH) {		// 下注推送
			this.answerPourGold(msg.data.uid, msg.data.direction, msg.data.pourGold);
		}
		else if(msg.type === TTZProto.GAME_TOUZI_PUSH) {		// 骰子推送
			this.answerTouziPush(msg.data.touzi1, msg.data.touzi2);
		}
		else if(msg.type === TTZProto.GAME_RESOUT_PUSH) {		// 结果推送
			this.answerResoutPush(msg.data.resout);
		}
		else if(msg.type === TTZProto.GAME_BUREAU_PUSH) {		// 局数变化推送
			this.setBureau(msg.data.bureau);
			this.gameEndClearData();
		}
		else if(msg.type === TTZProto.GAME_ASKTOBEPLAYER_PUSH) {	// 下庄推送
			this.answerAskToBePlayer();
		}
	}
};

model.gameEndClearData = function() {
	this.pourPool[TTZProto.TIANMEN] = [];
	this.pourPool[TTZProto.ZHONGMEN] = [];
	this.pourPool[TTZProto.DIMEN] = [];
};

model.getRoomId = function() {
	return this.roomId;
};

model.setBureau = function(bureau) {
	this.bureau = bureau;
};

model.getBureau = function() {
	return this.bureau;
};

model.getProfitPercentage = function() {
	return this.profitPercentage/100;
};

model.getMaxBureau = function() {
	return this.maxBureau;
};

model.getUsers = function() {
	return this.userArr;
};

model.getMyChairId = function() {
	return this.myChairId;
};

model.getMyUid = function() {
	return this.myUid;
};

model.getBankerUid = function() {
	return this.bankerUid;
};

model.getMe = function() {
	for(var i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].userInfo.uid === this.myUid) {
			return this.userArr[i];
		}
	}
	return null;
};

model.getBanker = function() {
	for(var i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].userInfo.uid === this.bankerUid) {
			return this.userArr[i];
		}
	}
	return null;
};

model.getUserByUid = function(uid) {
	for(var i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].userInfo.uid === uid) {
			return this.userArr[i];
		}
	}
	return null;
};

model.getUsersCount = function() {
	return this.userArr.length;
};

model.getUsers = function() {
	return this.userArr;
};

model.addUser = function(user) {
	user.userInfo.nickname = Global.Player.convertNickname(user.userInfo.nickname);
	for(var i = this.userArr.length-1; i >= 0; --i) {
		if(this.userArr[i].chairId === user.chairId) {
			this.userArr.splice(i, 1);
		}
	}
	this.userArr.push(user);
};

model.delUser = function(user) {
	for(var i = this.userArr.length-1; i >= 0; --i) {
		if(this.userArr[i].chairId === user.chairId) {
			this.userArr.splice(i, 1);
		}
	}
	for(var key in this.bankerPool) {
		if(this.bankerPool.hasOwnProperty(key)) {
			var index = this.bankerPool[key].indexOf(user.userInfo.uid);
			if(index >= 0) { this.bankerPool[key].splice(index, 1); }
		}
	}
	if(user.userInfo.uid === this.myUid) { 
		this.onDestroy(); 
	}
};

model.getGameStatus = function() {
	return this.gameStatus;
};

model.getBankerPourPool = function() {
	return this.pourPool[TTZProto.ZHUANGJIA];
};

model.getMyPourGold = function() {
	var pourGold = 0;
	for(var key in this.pourPool) {
		if(this.pourPool.hasOwnProperty(key) && parseInt(key) !== TTZProto.ZHUANGJIA) {
			for(var i = 0; i < this.pourPool[key].length; ++i) {
				if(this.pourPool[key][i].uid === this.myUid) {
					pourGold += this.pourPool[key][i].pourGold; 
				}
			}
		}
	}
	return pourGold;
};

model.getPourGoldOnDir = function(dir) {
	var pourGold = 0;
	for(var i = 0; i < this.pourPool[dir].length; ++i) {
		pourGold += this.pourPool[dir][i].pourGold;
	}
	return pourGold;
};

model.getAllPourGold = function() {
	var pourGold = 0;
	for(var key in this.pourPool) {
		if(this.pourPool.hasOwnProperty(key) && parseInt(key) !== TTZProto.ZHUANGJIA) {
			for(var i = 0; i < this.pourPool[key].length; ++i) {
				pourGold += this.pourPool[key][i].pourGold;
			}
		}
	}
	return pourGold;
};

model.getMyPourGoldOnDir = function(dir) {
	var pourGold = 0;
	for(var i = 0; i < this.pourPool[dir].length; ++i) {
		if(this.pourPool[dir][i].uid === this.myUid) {
			pourGold += this.pourPool[dir][i].pourGold;
		}
	}
	return pourGold;
};

model.getTouzi = function() {
	return {
		touzi1: this.touzi1,
		touzi2: this.touzi2,
	};
};

// 获取游戏走势
model.getGameDirRecord = function() {
	return this.dirRecord;
};

model.setChooseCoin = function(coin) {
	this.chooseCoin = coin;
};

model.getChooseCoin = function() {
	return this.chooseCoin || 1;
};

model.getCardsArr = function() {
	return this.cardsArr;
};

// 获取当前选择的庄家额度
model.getBankGold = function() {
	return this.bankGold;
};

model.answerTobeBanker = function(bankerUid, bankGold){
	if(this.bankerPool[bankGold].indexOf(bankerUid) === -1) {
		this.bankerPool[bankGold].push(bankerUid);
	}
};

model.getBankerPool = function() {
	return this.bankerPool;
};

model.getResout = function() {
	return this.resout;
};

model.answerBankerChange = function(bankerUid, bankGold) {
	this.bankGold = bankGold;
	this.bankerUid = bankerUid;
	this.pourPool[TTZProto.ZHUANGJIA].curGold = bankGold;
	this.pourPool[TTZProto.ZHUANGJIA].pourGold = bankGold;
	//this.bureau = 1;
	//for(var i = 0; i < this.bankerPool[bankGold].length; ++i) {
	//	if(this.bankerPool[bankGold][i] === bankerUid) {
	//		this.bankerPool[bankGold].splice(i, 1);
	//	}
	//}
};

model.answerContinueBanker = function(bankerUid, bankGold) {
	this.bankGold = bankGold;
	this.pourPool[TTZProto.ZHUANGJIA].curGold += bankGold;
	this.pourPool[TTZProto.ZHUANGJIA].pourGold += bankGold;
};

model.answerTouziPush = function(touzi1, touzi2) {
	this.touzi1 = touzi1;
	this.touzi2 = touzi2;
};

model.answerPourGold = function(uid, direction, pourGold) {
	var isInPool = false;
	for(var i = 0; i < this.pourPool[direction].length; ++i) {
		if(this.pourPool[direction][i].uid === uid) {
			this.pourPool[direction][i].pourGold += pourGold; 
			isInPool = true;
			break;
		}
	}
	if(! isInPool) {
		this.pourPool[direction].push({
			uid: uid,
			pourGold: pourGold
		});
	}
};

model.answerResoutPush = function(resout) {
	this.resout = resout;
	this.cardsArr = resout.cardsArr;
	this.usersWin = resout.usersWin;
	this.winArr = resout.winArr;
	var i;
	for(var key in this.usersWin) {
		for(i = 0; i < this.userArr.length; ++i) {
			if(this.userArr[i].userInfo.uid === key) {
				if(this.usersWin[key] > 0) {
					this.userArr[i].userInfo.gold += this.usersWin[key]*(1-this.getProfitPercentage());
				} else {
					this.userArr[i].userInfo.gold += this.usersWin[key];
				}
				if(this.userArr[i].userInfo.robot && this.userArr[i].userInfo.gold <= 0) {
					this.userArr[i].userInfo.gold = Math.floor(Math.random()*1000)*10;
				}
				break;
			}
		}
	}
	var banker = this.getBanker();
	if(banker) { 
		if(resout.bankerWin > 0) {
			banker.userInfo.gold += resout.bankerWin*(1-this.getProfitPercentage()); 
			this.pourPool[TTZProto.ZHUANGJIA].curGold += resout.bankerWin*(1-this.getProfitPercentage());
		} else {
			banker.userInfo.gold += resout.bankerWin; 
			this.pourPool[TTZProto.ZHUANGJIA].curGold += resout.bankerWin;
		}
	}
	if(this.dirRecord.length > 9) {
		for(i = this.dirRecord.length-9; i > 0; --i) {
			this.dirRecord.shift();
		}
	}
	this.dirRecord.push(this.cardsArr);
};


model.answerAskToBePlayer = function() {
	this.bankerUid = null;
};
