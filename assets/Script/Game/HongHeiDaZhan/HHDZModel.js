let proto = require('./API/HHDZGameProto');
let HHDZModel = module.exports = {};

//花色定义
HHDZModel.COLOR_LABEL = [
    '方',
    '梅',
    '红',
    '黑'
];

HHDZModel.COLOR = {
    red: new cc.Color(173, 27, 27, 255),
    black: new cc.Color(32, 27, 27, 255)
};

HHDZModel.init = function (data) {
    this.data = data;
    this.profitPercentage = data.gameData.profitPercentage;
};

HHDZModel.getCardLogicValue = function(cardData) {
    return cardData & this.LOGIC_MASK_VALUE;
};

HHDZModel.getCardColorValue = function (cardData) {
    return (cardData & this.LOGIC_MASK_COLOR) / 16;
};

HHDZModel.getCardDesNormal = function (cardData) {
    return this.COLOR_LABEL[this.getCardColorValue(cardData)] + this.getCardLogicValue(cardData);
};

HHDZModel.onDestroy = function () {
    this.data = null;
};