var RoomProto = module.exports;

RoomProto.GAME_STATUS_PLAYING = 1;

RoomProto.USER_READY_NOTIFY =                   301;            // 用户准备的通知
RoomProto.USER_READY_PUSH =                     401;            // 用户准备的推送

RoomProto.OTHER_USER_ENTRY_ROOM_PUSH =          402;            // 用户进入房间的推送

RoomProto.USER_LEAVE_ROOM_NOTIFY =              303;            // 用户离开房间的通知
RoomProto.USER_LEAVE_ROOM_RESPONSE =			403;            // 用户离开房间的回复
RoomProto.USER_LEAVE_ROOM_PUSH =                404;			// 用户离开房间推送

RoomProto.ROOM_DISMISS_PUSH =                   405;            // 房间解散的推送

RoomProto.ROOM_USER_INFO_CHANGE_PUSH =          406;            // 房间用户信息变化的推送

RoomProto.USER_CHAT_NOTIFY =                    307;            // 用户聊天通知
RoomProto.USER_CHAT_PUSH =                      407;            // 用户聊天推送

RoomProto.USER_OFF_LINE_PUSH =                  408;            // 用户掉线的推送

RoomProto.ROOM_DRAW_FINISHED_PUSH =             409;            // 开设的房间局数用完推送

RoomProto.ROOM_NOTICE_PUSH =                    410;            // 房间提示推送

RoomProto.GAME_WIN_RATE_NOTIFY =				311;
RoomProto.GAME_WIN_RATE_PUSH =					411;

RoomProto.USER_RECONNECT_NOTIFY =				312;			// 玩家断线重连
RoomProto.USER_RECONNECT_PUSH	 =				412;

RoomProto.ASK_FOR_DISMISS_NOTIFY =				313;			// 玩家请求解散房间
RoomProto.ASK_FOR_DISMISS_PUSH =				413;

RoomProto.GAME_END_PUSH	=						414;			// 最终结果推送

RoomProto.SORRY_I_WILL_WIN_NOTIFY =             415;            // 对不起，这局我要赢

RoomProto.ASK_FOR_DISMISS_STATUS_NOTIFY	=		316;			// 获取当前请求解散状态
RoomProto.ASK_FOR_DISMISS_STATUS_PUSH	=		416;

RoomProto.GET_ROOM_SHOW_USER_INFO_NOTIFY =      317;            // 获取房间需要显示的玩家信息通知
RoomProto.GET_ROOM_SHOW_USER_INFO_PUSH =        417;            // 获取房间需要显示的玩家信息推送

RoomProto.GET_ROOM_SCENE_INFO_NOTIFY =          318;            // 获取房间场景信息的通知
RoomProto.GET_ROOM_SCENE_INFO_PUSH =            418;            // 获取房间场景信息的推送

RoomProto.GET_ROOM_ONLINE_USER_INFO_NOTIFY =    319;            // 获取房间在线用户信息的通知
RoomProto.GET_ROOM_ONLINE_USER_INFO_PUSH =      419;            // 获取房间在线用户信息的推送

RoomProto.EXIT_WAIT_SECOND						= 30;
RoomProto.NOANSWER_WAIT_SECOND					= 120;
RoomProto.ANSWER_EXIT_SECOND					= 30;

RoomProto.userStatusEnum = {		// 玩家状态
    NONE:			0,
    READY:			1,
    PLAYING:		2,
    OFFLINE:		4
};

RoomProto.IWillWinNotify = function () {
    return {
        type: RoomProto.SORRY_I_WILL_WIN_NOTIFY,
        data: {}
    }
};

RoomProto.selfEntryRoomPush = function (roomUserInfoArr, gameData, kindId){
    return {
        roomUserInfoArr: roomUserInfoArr,
        gameData: gameData,
        kindId: kindId
    }
};

RoomProto.roomMessagePush = function (msg){
    return msg;
};

RoomProto.userChatNotify = function (chatData) {
    return {
        type: RoomProto.USER_CHAT_NOTIFY,
        data:{
            chatData: chatData
        }
    }
};

RoomProto.userChatPush = function (chairId, chatData) {
    return {
        type: RoomProto.USER_CHAT_PUSH,
        data:{
            chairId: chairId,
            chatData: chatData
        }
    }
};

RoomProto.userReadyNotify = function (isReady){
    return {
        type: RoomProto.USER_READY_NOTIFY,
        data: {
            isReady:isReady
        }
    }
};

RoomProto.userReadyPush = function (chairId){
    return {
        type: RoomProto.USER_READY_PUSH,
        data: {
            chairId:chairId
        }
    }
};

RoomProto.otherUserEntryRoomPush = function (roomUserInfo){
    return {
        type: RoomProto.OTHER_USER_ENTRY_ROOM_PUSH,
        data: {
            roomUserInfo: roomUserInfo
        }
    }
};

RoomProto.userLeaveRoomNotify = function (){
    return {
        type: RoomProto.USER_LEAVE_ROOM_NOTIFY,
        data: {}
    }
};

RoomProto.userLeaveRoomResponse = function (chairId){
    return {
        type: RoomProto.USER_LEAVE_ROOM_RESPONSE,
        data: {
            chairId: chairId
        }
    }
};

RoomProto.userLeaveRoomPush = function (roomUserInfo){
    return {
        type: RoomProto.USER_LEAVE_ROOM_PUSH,
        data: {
            roomUserInfo: roomUserInfo
        }
    }
};

RoomProto.roomDismissReason = {
    RDR_NONE:				    0,	/* 正常结束 */
    RDR_OWENER_ASK:				1,	/* 未开始游戏,房主解散 */
    RDR_USER_ASK:				2,	/* 游戏中,请求结束 */
    RDR_TIME_OUT:				4	/* 超时未响应 */
};

RoomProto.roomDismissPush = function (roomDismissReason){
    return {
        type: RoomProto.ROOM_DISMISS_PUSH,
        data: {
            reason: roomDismissReason
        }
    }
};

RoomProto.userInfoChangePush = function (changeInfo) {
    return {
        type: RoomProto.ROOM_USER_INFO_CHANGE_PUSH,
        data: {
            changeInfo: changeInfo
        }
    }
};

/*
RoomProto.userRequestDismissRoomNotify = function (){
    return {
        type: RoomProto.USER_REQUEST_DISMISS_ROOM_NOTITY,
        data: {}
    };
};

RoomProto.userRequestDismissRoomPush = function (chairId){
    return {
        type: RoomProto.USER_REQUEST_DISMISS_ROOM_PUSH,
        data:{
            requestchairId: chairId
        }
    }
};

RoomProto.userResponseDismissRoomNotify = function (isAgree){
    return {
        type: RoomProto.USER_RESPONSE_DISMISS_ROOM_NOTIFY,
        data: {
            isAgree: isAgree
        }
    }
};

RoomProto.userResponseDismissRoomPush = function (isAgree){
    return {
        type: RoomProto.USER_RESPONSE_DISMISS_ROOM_PUSH,
        data:{
            isAgree: isAgree
        }
    }
};
*/

RoomProto.userOffLinePush = function (chairId){
    return {
        type: RoomProto.USER_OFF_LINE_PUSH,
        data: { chairId: chairId }
    }
};

RoomProto.roomDrawFinished = function (allDrawScoreRecord){
    return {
        type: RoomProto.ROOM_DRAW_FINISHED_PUSH,
        data: {
            allDrawScoreRecord:allDrawScoreRecord
        }
    }
};

RoomProto.getGameWinRateNotifyData = function(rate) {
    return {
        type: this.GAME_WIN_RATE_NOTIFY,
        data: { rate: rate }
    };
};

RoomProto.getGameWinRatePushData = function() {
    return {
        type: this.GAME_WIN_RATE_PUSH,
        data: { }
    }
};

// 游戏规则格式
RoomProto.getGameRule = function(bureau, isOwnerPay, memberCount, diamondCost, gameType, otherRule) {
    return {
        bureau: bureau,				//局数
        isOwnerPay: isOwnerPay,		//是否房主支付
        memberCount: memberCount,	//房间人数
        diamondCost: diamondCost,	//房卡
        gameType: gameType,			//游戏类型
        otherRule: otherRule		//游戏中特殊规则
    };
};

RoomProto.getUserReconnectNotifyData = function() {
    return {
        type: this.USER_RECONNECT_NOTIFY,
        data: { }
    };
};

RoomProto.getUserReconnectPushData = function(gameData) {
    return {
        type: this.USER_RECONNECT_PUSH,
        data: {
            gameData: gameData
        }
    };
};

RoomProto.getAskForDismissNotifyData = function(isExit) {
    return {
        type: this.ASK_FOR_DISMISS_NOTIFY,
        data: {
            isExit: isExit
        }
    };
};

RoomProto.getAskForDismissPushData = function(chairIdArr, nameArr, scoreArr, tm, chairId) {
    return {
        type: this.ASK_FOR_DISMISS_PUSH,
        data: {
            nameArr: nameArr,
            scoreArr: scoreArr,
            chairIdArr: chairIdArr,
            tm: tm,
            askChairId: chairId
        }
    };
};

// 游戏总结算推送
RoomProto.getGameEndPushData = function(resout) {
    return {
        type: this.GAME_END_PUSH,
        data: {
            resout: resout
        }
    };
};

RoomProto.getAskDismissStatusNotifyData = function() {
    return {
        type: this.ASK_FOR_DISMISS_STATUS_NOTIFY,
        data: { }
    };
};

RoomProto.getAskDismissStatusPushData = function(isOnDismiss) {
    return {
        type: this.ASK_FOR_DISMISS_STATUS_PUSH,
        data: { 
			isOnDismiss: isOnDismiss
		}
    };
};

RoomProto.getRoomShowUserInfoNotify = function () {
    return {
        type: RoomProto.GET_ROOM_SHOW_USER_INFO_NOTIFY,
        data:{}
    }
};

RoomProto.getRoomShowUserInfoPush = function (selfUserInfo, shenSuanZiInfo, fuHaoUserInfoArr) {
    return {
        type: RoomProto.GET_ROOM_SHOW_USER_INFO_PUSH,
        data:{
            selfUserInfo: selfUserInfo,
            shenSuanZiInfo: shenSuanZiInfo,
            fuHaoUserInfoArr: fuHaoUserInfoArr
        }
    }
};

RoomProto.getRoomSceneInfoNotify = function () {
    return {
        type: RoomProto.GET_ROOM_SCENE_INFO_NOTIFY,
        data:{}
    }
};

RoomProto.getRoomSceneInfoPush = function (roomUserInfoArr, gameData) {
    return {
        type: RoomProto.GET_ROOM_SCENE_INFO_PUSH,
        data:{
            roomUserInfoArr: roomUserInfoArr,
            gameData: gameData
        }
    }
};

RoomProto.getRoomOnlineUserInfoNotify = function () {
    return {
        type: RoomProto.GET_ROOM_ONLINE_USER_INFO_NOTIFY,
        data:{}
    }
};

RoomProto.getRoomOnlineUserInfoPush = function (shenSuanZiInfo, fuHaoUserInfoArr) {
    return {
        type: RoomProto.GET_ROOM_ONLINE_USER_INFO_PUSH,
        data:{
            shenSuanZiInfo: shenSuanZiInfo,
            fuHaoUserInfoArr: fuHaoUserInfoArr
        }
    }
};

