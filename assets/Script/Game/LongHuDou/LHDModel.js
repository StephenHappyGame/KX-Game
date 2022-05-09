let model = module.exports;
let gameProto = require('./LHDProto');
let RoomProto = require('../../API/RoomProto');

model.setEntryRoomData = function(msg) {
	this.onLoad(msg);
};

model.onLoad = function (msg) {
    let data = msg.gameData;
    this.profitPercentage = data.profitPercentage;
    this.roomID = msg.roomID;
    this.selfUid = Global.Player.getPy('uid');
    this.kindId = msg.kindId;

    this.betCountList = {};
    this.betCountList[gameProto.LONG] = 0;
    this.betCountList[gameProto.HU] = 0;
    this.betCountList[gameProto.HE] = 0;
};

model.onDestroy = function() {
};