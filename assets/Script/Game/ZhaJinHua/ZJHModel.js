let Player = require('../../Models/Player');
let proto = require('./GameProtoZJH');
let ZJHModel = module.exports = {};
let RoomProto = require('../../API/RoomProto');
let GameTypes = require('../../Models/GameTypes');

//花色定义
ZJHModel.COLOR_LABEL = [
    '方',
    '梅',
    '红',
    '黑'
];

ZJHModel.COLOR = {
    red: new cc.Color(173, 27, 27, 255),
    black: new cc.Color(32, 27, 27, 255)
};

//位置定义
ZJHModel.POS_BOTTOM = 0;
ZJHModel.POS_RIGHT_BOTTOM = 1;
ZJHModel.POS_RIGHT_TOP = 2;
ZJHModel.POS_LEFT_TOP = 3;
ZJHModel.POS_LEFT_BOTTOM = 4;
ZJHModel.POS_TOP = 5;

ZJHModel.chairPos = [];

//逻辑掩码
ZJHModel.LOGIC_MASK_COLOR = 0xF0;
ZJHModel.LOGIC_MASK_VALUE = 0x0F;

ZJHModel.init = function (data) {
    this.data = data;
    this.profitPercentage = data.gameData.profitPercentage;
    this.msg = [];
    this.gameTypeInfo = data.gameData.gameTypeInfo;

    //设置玩家可下注分
    this.setStakeLevel();

    //对玩家按椅子号大小进行排序
    this.sortRoomUser();

    //设置当前局数
    this.setCurDureau(this.data.gameData.curDureau);

    Global.MessageCallback.addListener('GameMessagePush', this);
    Global.MessageCallback.addListener('RoomMessagePush', this);
};

ZJHModel.getGameStartedOnce = function () {
    return this.data.gameData.gameStartedOnce;
};

ZJHModel.setGameStartedOnce = function () {
    this.data.gameData.gameStartedOnce = true;
};

ZJHModel.isGameStarted = function () {
    return this.data.gameData.gameStarted;


};

ZJHModel.getGameRule = function () {
    return this.data.gameData.gameRule;
};

ZJHModel.setStakeLevel = function () {
    if (this.isFangKa()) {
        for (let i = 0; i < proto.STAKE_LEVEL.length; i ++) {
            proto.STAKE_LEVEL[i] = proto.STAKE_LEVEL_BASE[i] * this.data.gameData.gameTypeInfo.baseScore;
        }
    } else {
        proto.STAKE_LEVEL = GameTypes.getGameInfoByGameTypeID(this.data.gameTypeID).stakeLevel;
        proto.STAKE_XUE_PIN = GameTypes.getGameInfoByGameTypeID(this.data.gameTypeID).stakeXuePin;
    }
};

ZJHModel.gameIsPlaying = function () {
    return this.data.gameStatus === RoomProto.GAME_STATUS_PLAYING;
};

ZJHModel.setGameIsPlaying = function () {
    this.data.gameStatus = RoomProto.GAME_STATUS_PLAYING;
};

ZJHModel.setGameOver = function () {
    this.data.gameStatus = null;
};

//0为普通金币模式，如果是正常的房间号，则为房卡模式
ZJHModel.isFangKa = function () {
    return true;
};

ZJHModel.setCurDureau = function (curDureau) {
    this.curDureau = curDureau;
};

ZJHModel.getJuShu = function () {
    // return '{0}/{1}'.format(this.curDureau, this.data.gameData.maxDureau);
    return this.curDureau;
};

ZJHModel.getRoomID = function () {
    let roomID = this.data.gameData.roomId + '';
    let count = 6 - roomID.length;
    if (count > 0) {
        for (let i = 0; i < count; i ++) {
            roomID = '0' + roomID;
        }
    }
    return roomID;
};

ZJHModel.sortRoomUser = function () {
    this.data.roomUserInfoArr.sort(function (a, b) {
        return a.chairId > b.chairId
    });
};

ZJHModel.removeRoomUserInfo = function (user) {
    for (let i = 0; this.data.roomUserInfoArr.length; i ++) {
        if (this.data.roomUserInfoArr[i].chairId === user.chairId) {
            this.data.roomUserInfoArr.splice(i , 1);
            break;
        }
    }
};

ZJHModel.isUserInRoom = function (user) {
    for (let i = 0; i < this.data.roomUserInfoArr.length; i ++) {
        if (user.userInfo.uid + '' === this.data.roomUserInfoArr[i].userInfo.uid + '') {
            return true;
        }
    }
    return false;
};

ZJHModel.addRoomUserInfo = function (user) {
    this.data.roomUserInfoArr.push(user);
    this.sortRoomUser();
};

ZJHModel.getUsers = function () {
    return this.data.roomUserInfoArr;
};

ZJHModel.clearData = function () {
    this.data = null;
    this.fangKa = false;
    this.msg = [];
};

ZJHModel.getSelfchairId = function () {
    for (let i = 0; i < this.data.roomUserInfoArr.length; i ++) {
        if (this.data.roomUserInfoArr[i].userInfo.uid === Player.getPy('uid')) {
            return parseInt(this.data.roomUserInfoArr[i].chairId);
        }
    }
};

ZJHModel.getChairIdByUid = function (uid) {
    for (let i = 0; i < this.data.roomUserInfoArr.length; i ++) {
        if (this.data.roomUserInfoArr[i].userInfo.uid === uid) {
            return this.data.roomUserInfoArr[i].chairId;
        }
    }
};

ZJHModel.getCardDesNormal = function (cardData) {
    return this.COLOR_LABEL[this.getCardColorValue(cardData)] + this.getCardLogicValue(cardData);
};

ZJHModel.getCardLogicValue = function(cardData) {
    return cardData & this.LOGIC_MASK_VALUE;
};

ZJHModel.getCardColorValue = function (cardData) {
    return (cardData & this.LOGIC_MASK_COLOR) / 16;
};

ZJHModel.getCardTypeStr = function (cardType) {
    switch (cardType) {
        case proto.CARD_TYPE_DAN_ZHANG:
            return '高牌';
        case proto.CARD_TYPE_DUI_ZI:
            return '对子';
        case proto.CARD_TYPE_SHUN_ZI:
            return '顺子';
        case proto.CARD_TYPE_TONG_HUA:
            return '同花';
        case proto.CARD_TYPE_TONG_HUA_SHUN:
            return '同花顺';
        case proto.CARD_TYPE_BAO_ZI:
            return '豹子';
    }
};

ZJHModel.messageCallbackHandler = function (route, msg) {
    if (!this.msg) {
        this.msg = [];
    }
    this.msg.push({route: route, msg: msg});
};

ZJHModel.checkHaveMsg = function () {
    Global.MessageCallback.removeListener('GameMessagePush', this);
    Global.MessageCallback.removeListener('RoomMessagePush', this);

    if (!!this.msg && this.msg.length > 0) {
        for (let i = 0; i < this.msg.length; i ++) {
            Global.MessageCallback.emitMessage(this.msg[i].route, this.msg[i].msg);
        }
    }
};