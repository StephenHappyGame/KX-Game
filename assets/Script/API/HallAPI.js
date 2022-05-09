/**
 * API used to manage user in the hall.
 * 
 * @category API
 * @exports HallAPI
 */
var HallAPI = module.exports = {};

/**
 * Sets *amount* of coins for the current user.
 * 
 * Uses **hall.userHandler.setCoins** route, and by default calls **UpdateUserInfoUI** route on success.
 * 
 * @param {number} amount - Amount of coins
 * @param {string | function} cbRouter - Callback router or callback function called on success
 * @param {function} cbFail - Callback function called on fail.
 */
HallAPI.setCoins = function(amount, cbRouter, cbFail) {
    let router = 'hall.userHandler.setCoins';
    let requestData = {
        gold: amount
    };
    
    Global.NetworkManager.send(router, requestData, cbRouter || 'UpdateUserInfoUI', cbFail);
}

/**
 * Attempts to entry the hall with specified *token* and *userInfo*.
 * 
 * Uses **connector.entryHandler.entry** route.
 * 
 * @param {string} token - token used to enter
 * @param {any} userInfo - user information used to enter
 * @param {function | string} cbRouter - route or callback function that will be invoked on success
 * @param {function} cbFail - callback function that will be invoked on failure
 */
HallAPI.entry = function (token, userInfo, cbRouter, cbFail) {
    var router = 'connector.entryHandler.entry';
    var requestData = {
        token: token,
        userInfo: userInfo
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'EntryHallResponse', cbFail);
};

// --------------------------------------------用户相关------------------------------------------
/**
 * Searches for user with specified *uid*.
 * 
 * Uses **hall.userHandler.searchUserData** route.
 * 
 * @param {string} uid - uid of user to search
 * @param {function | string} cbRouter - route or callback function that will be invoked on success
 */
HallAPI.searchRequest = function (uid, cbRouter) {
    var router = 'hall.userHandler.searchUserData';
    var requestData = {
        uid:uid
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'SearchResponse')
};

/**
 * Binds phone request.
 * 
 * Uses **hall.userHandler.bindPhone** route.
 * 
 * @param {string} phone - phone to bind
 * @param {string} verificationCode - received verification code
 * @param {any} imgCodeInfo - image code information
 * @param {function | string} cbRouter - function or route that will be invoked on success
 */
HallAPI.bindPhoneRequest = function (phone, verificationCode, imgCodeInfo, cbRouter) {
    var router = 'hall.userHandler.bindPhone';
    var requestData = {
        phone: phone,
        verificationCode: verificationCode,
        imgCodeInfo: imgCodeInfo
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'BindPhoneResponse');
};

/**
 * Attempts to change the nickname of the current user.
 * 
 * Uses **hall.userHandler.updateNickname** route.
 * 
 * @param {string} nickname - requested nickname
 * @param {function | string} cbRouter - function or route that will be invoked on success
 */
HallAPI.changeNicknameRequest = function (nickname, cbRouter) {
    var router = 'hall.userHandler.updateNickname';
    var requestData = {
        nickname: nickname
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'ChangeNicknameResponse');
};

/**
 * Attempts to change the avatar of the current user.
 * 
 * Uses **hall.userHandler.updateAvatar** route.
 * 
 * @param {string} avatar - name of the requested avatar
 * @param {function | string} cbRouter - function or route that will be invoked on success
 */
HallAPI.changeAvatarRequest = function (avatar, cbRouter) {
    var router = 'hall.userHandler.updateAvatar';
    var requestData = {
        avatar: avatar
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'ChangeAvatarResponse');
};

// 更新银行卡信息
HallAPI.updateBankCardInfoRequest = function (cardNumber, bankName, ownerName, cbRouter) {
    var router = 'hall.userHandler.updateBankCardInfo';
    var requestData = {
        bankCardInfo: {
            cardNumber: cardNumber,
            bankName: bankName,
            ownerName: ownerName
        }
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'UpdateBankCardInfoResponse');
};

// 更新支付宝信息
HallAPI.updateAliPayInfoRequest = function (aliPayAccount,  ownerName, cbRouter) {
    var router = 'hall.userHandler.updateAliPayInfoRequest';
    var requestData = {
        aliPayInfo: {
            aliPayAccount: aliPayAccount,
            ownerName: ownerName
        }
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'UpdateAliPayInfoResponse');
};

// 保险柜操作
/**
 * @param count 大于0为存入，小于0为取出
 * @param password 取出时需要密码
 * @param cbRouter
 */
HallAPI.safeBoxOperationRequest = function (count, password, cbRouter) {
    var router = 'hall.userHandler.safeBoxOperation';
    var requestData = {
        count: count,
        safePassword: password
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'SafeBoxOperationResponse');
};

// 修改登录密码
HallAPI.updateLoginPasswordRequest = function (oldPassword, newPassword, cbRouter) {
    var router = 'hall.userHandler.updateLoginPassword';
    var requestData = {
        oldPassword: oldPassword,
        newPassword: newPassword
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'UpdateLoginPasswordResponse');
};

// 修改保险柜密码
HallAPI.updateSafePasswordRequest = function (oldPassword, newPassword, cbRouter) {
    var router = 'hall.userHandler.updateSafePassword';
    var requestData = {
        oldPassword: oldPassword,
        newPassword: newPassword
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'UpdateSafePasswordResponse');
};

// 提款申请
/**
 * @param count
 * @param withdrawCashType: enumeration.withdrawCashType
 * @param cbRouter
 */
HallAPI.withdrawCashRequest = function (count, withdrawCashType, cbRouter) {
    var router = 'hall.currencyHandler.withdrawCashRequest';
    var requestData = {
        count: count,
        withdrawCashType: withdrawCashType
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'WithdrawCashResponse');
};

// 提取佣金
HallAPI.extractionCommissionRequest = function (cbRouter) {
    var router = 'hall.currencyHandler.extractionCommission';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'ExtractionCommissionResponse');
};

// --------------------------------------------排行榜相关------------------------------------------
// 获取今日赢金币数量排行榜
HallAPI.getTodayWinGoldCountRankRequest = function(startIndex, count, cbRouter){
    var router = 'center.rankHandler.getTodayWinGoldCountRankRequest';
    var requestData = {
        startIndex: startIndex,
        count: count
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetTodayWinGoldCountRankResponse');
};

// --------------------------------------------充值相关------------------------------------------
//购买商城物品
HallAPI.purchaseRechargeItemRequest = function(itemID, rechargePlatform, rechargeInfo, cbRouter){
    var router = 'hall.rechargeHandler.purchaseItem';
    var requestData = {
        itemID: itemID,
        rechargePlatform: rechargePlatform,
        rechargeInfo: rechargeInfo
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'PurchaseRechargeItemResponse');
};

// --------------------------------------------记录相关------------------------------------------
// 获取记录
/**
 * recordType : enumeration.recordType
 */
HallAPI.getRecordDataRequest = function(recordType, startIndex, count, cbRouter){
    var router = 'hall.recordHandler.getRecordData';
    var requestData = {
        recordType: recordType,
        startIndex: startIndex,
        count: count
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetRecordDataResponse')
};

HallAPI.getGameRecordDataRequest = function (matchData, sortData, cbRouter) {
    var router = 'hall.recordHandler.getGameRecordDataRequest';
    var requestData = {
        matchData: matchData,
        sortData: sortData,
        startIndex: 0,
        count: 10
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetGameRecordDataResponse');
};

HallAPI.getDirectlyMemberRecordDataRequest = function (startIndex, count, cbRouter) {
    var router = 'hall.recordHandler.getDirectlyMemberRecordData';
    var requestData = {
        startIndex: startIndex,
        count: count
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetDirectlyMemberRecordDataResponse')
};

HallAPI.getAgentMemberRecordDataRequest = function (startIndex, count, cbRouter) {
    var router = 'hall.recordHandler.getAgentMemberRecordData';
    var requestData = {
        startIndex: startIndex,
        count: count
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetAgentMemberRecordDataResponse')
};

// --------------------------------------------房间相关------------------------------------------
HallAPI.createRoomRequest = function (parameters, gameTypeID, cbRouter){
    var router = 'hall.gameHandler.createRoom';
    var requestData = {
        gameRule: parameters,
        gameTypeID: gameTypeID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'CreateRoomResponse');
};

HallAPI.joinRoomRequest = function (joinRoomID, cbRouter, cbFail){
    var router = 'hall.gameHandler.joinRoom';
    var requestData = {
        roomId: joinRoomID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'JoinRoomResponse', cbFail);
};

HallAPI.exitRoomRequest = function(cbRouter){
    var router = 'hall.gameHandler.exitRoom';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'ExitRoomResponse');
};

HallAPI.matchRoomRequest = function (gameTypeID, cbRouter) {
    var router = 'hall.gameHandler.matchRoom';
    var requestData = {
        gameTypeID: gameTypeID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'MatchRoomResponse');
};

HallAPI.stopMatchRoomRequest = function (cbRouter) {
    var router = 'hall.gameHandler.stopMatchRoom';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'StopMatchRoomResponse');
};

HallAPI.getAllRoomGameDataByKind = function (kindID, cbRouter) {
    var router = 'hall.gameHandler.getAllRoomGameDataByKind';
    var requestData = {
        kindID: kindID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetAllRoomGameDataByKindResponse');
};

HallAPI.getRoomGameDataByRoomID = function (roomID, cbRouter) {
    var router = 'hall.gameHandler.getRoomGameDataByRoomID';
    var requestData = {
        roomID: roomID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetRoomGameDataByRoomIDResponse');
};

// --------------------------------------------其他相关------------------------------------------
HallAPI.readEmailRequest = function(emailID, cbRouter){
    var router = 'hall.emailHandler.readEmail';
    var requestData = {
        emailID: emailID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'ReadEmailResponse')
};
