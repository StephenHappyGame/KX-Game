/*
 * 百家乐model
 */
var model = module.exports;
var BJLProto = require('./BJLProto');
var BJLLogic = require('./BJLLogic');
var RoomProto = require('../../API/RoomProto');
var enumeration = require('../../Shared/enumeration');

model.setEntryRoomData = function(msg) {
	this.onLoad(msg);
};

model.onLoad = function (msg) {
    let data = msg.gameData;
    this.profitPercentage = data.profitPercentage;
    this.roomID = data.roomId;
    this.selfUid = Global.Player.getPy('uid');
	this.kindId = enumeration.gameType.BJL;

    //this.betCountList = {};
    //this.betCountList[gameProto.LONG] = 0;
    //this.betCountList[gameProto.HU] = 0;
    //this.betCountList[gameProto.HE] = 0;
};

model.onDestroy = function() {
};

