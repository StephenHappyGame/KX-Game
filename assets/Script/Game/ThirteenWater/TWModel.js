var model = module.exports;
var TWLogic = require('./TWLogic');
var GameProto = require('./TWProto');
var RoomProto = require('../../API/RoomProto');

model.init = function (msg) {
    this.userArr = msg.roomUserInfoArr;
    let data = msg.gameData;
    this.roomID = data.roomID;
    this.cardsArr = data.cardsArr;
    this.sortCardChairArr = data.sortCardChairArr;
    this.mianbaiArr = data.mianbaiArr;
    this.gameStatus = data.gameStatus;
    this.playingChairArr = data.playingChairArr;
    this.gameRule = data.gameRule;
    this.resout = data.resout;
    this.gameTypeInfo = data.gameTypeInfo;

    this.myUid = Global.Player.getPy('uid');
    for(let i = 0; i < this.userArr.length; ++i) {
        if(this.userArr[i].userInfo.uid === this.myUid) {
            this.myChairId = this.userArr[i].chairId;
            break;
        }
    }
};

model.onDestroy = function() {
};

model.getIndexByChairId = function (chairId) {
    return (chairId + 4 - this.myChairId)%4;
};

model.getMyChairId = function() {
	return this.myChairId;
};

model.getMyUid = function() {
	return this.myUid;
};

model.getGameRule = function () {
    return this.gameRule;
};

model.getPlayerById = function(uid) {
	for(let i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].userInfo.uid === uid) {
			return this.userArr[i];
		}
	}
	return null;
};

model.getPlayerByChairId = function(chairId) {
	for(let i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].chairId === chairId) {
			return this.userArr[i];
		}
	}
	return null;
};

model.getPlayerCount = function() {
	return this.userArr.length;
};

model.getPlayers = function() {
	return this.userArr;
};

model.addPlayer = function(player) {
	for(let i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].chairId === player.chairId) {
			this.userArr.splice(i, 1);
			break;
		}
	}
	this.userArr.push(player);
};

model.delPlayer = function(chairId) {
	for(let i = 0; i < this.userArr.length; ++i) {
		if(this.userArr[i].chairId === chairId) {
			this.userArr.splice(i, 1);
			break;
		}
	}
};

model.updatePlayer = function (changeUserInfo) {
    for (let i = 0; i < this.userArr.length; ++i){
        if (this.userArr[i].userInfo.uid === changeUserInfo.uid){
            this.userArr[i].userInfo = changeUserInfo;
            break;
        }
    }
};

model.setResoutData = function(resout) {
	/*var finalScoreArr = TWLogic.getScoreArrByResout(resout);
	var i;
	for(i = 0; i < this.gameRule.memberCount; ++i) {
		this.curScoreArr[i] += finalScoreArr[i];
	}*/
	this.resout = resout;
};

model.getResout = function() {
	return this.resout;
};

model.setCardsPushData = function(cardsArr, playingChairArr) {
    for(let i = 0; i < this.mianbaiArr.length; ++i) {
        this.mianbaiArr[i] = false;
    }
	this.cardsArr = cardsArr;
    this.playingChairArr = playingChairArr;
    this.sortCardChairArr = [];
};

model.getCardsArr = function() {
	return this.cardsArr;
};

model.setPlayerReady = function(chairId) {
	var player = this.getPlayerByChairId(chairId);
	player.userStatus |= RoomProto.userStatusEnum.READY;
};

model.getPlayerReady = function(chairId) {
	var player = this.getPlayerByChairId(chairId);
	return ((player.userStatus&RoomProto.userStatusEnum.READY) > 0);
};

model.insertSortChairArr = function(chairId) {
	this.sortCardChairArr.push(chairId);
};

model.hasSortCard = function(chairId) {
	return (this.sortCardChairArr.indexOf(chairId) !== -1);
};

model.resetGameData = function() {
    this.resout = null;
	var i;
	this.sortCardChairArr = [];
	for(i = 0; i < this.userArr.length; ++i) {
		if((this.userArr[i].userStatus&RoomProto.userStatusEnum.READY) > 0) {
			this.userArr[i].userStatus -= RoomProto.userStatusEnum.READY;
		}
	}
};

model.setMianbai = function(chairId) {
	this.mianbaiArr[chairId] = true;
};

model.getMianbai = function(chairId) {
	return this.mianbaiArr[chairId];
};

model.isCurChairPlaying = function (chairId) {
	return this.playingChairArr.indexOf(chairId) !== -1;
};
