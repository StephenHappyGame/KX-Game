var gameCommon = module.exports = {};

gameCommon.INVALID_CHAIR =                          -1;                 // 无效椅子
gameCommon.INVALID_CARD_DATA =                      -1;                 //无效的牌
gameCommon.INVALID_CARD_INDEX =                     -1;                 //无效的索引

gameCommon.userStatus = {
    US_NULL:						0x00,								//没有状态
    US_FREE:						0x01,								//空闲状态
    US_READY:					    0x02,								//准备状态
    US_PLAYING:					    0x03,								//游戏状态
    US_OFFLINE:					    0x04								//断线状态
};

gameCommon.gameEndReason = {
    GER_NORMAL:					    0x00,								//常规结束
    GER_DISMISS:					0x01,								//游戏解散
    GER_USER_LEAVE:				    0x02,								//用户离开
    GER_NETWORK_ERROR:			    0x03								//网络错误
};

gameCommon.scoreInfo = function (type, score){
    type = type || 0;
    score = score || 0;
    return {
        type: type,
        score: score
    }
};

gameCommon.roomUserInfo = function (userInfo, chairId){
    return {
        userInfo: userInfo,
        chairId: chairId
    }
};