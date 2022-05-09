/**
 * All possible codes that can be received in the message.
 * 
 * @category Constants
 * @exports Code
 */
var Code = function () {
    /** @property { number } - Successfull order */
    this.OK = 0;

    /** @property { number } - Data request failed */
    this.FAIL = 1;
    /** @property { number } - Request data error */
    this.REQUEST_DATA_ERROR = 2;
    /** @property { number } - Database operation error  */
    this.MYSQL_ERROR = 3;
    /** @property { number } - Invalid user */
    this.INVALID_UERS = 4;
    /** @property { number } - Invalid parameters */
    this.INVALID_PARAM = 5;
    /** @property { number } - Insufficient permissions */
    this.PERMISSION_NOT_ENOUGH = 6;
    /** @property { number } - SMS code error */
    this.SMS_CODE_ERROR = 7;
    /** @property { number } - Image code error */
    this.IMG_CODE_ERROR = 8;
    
    /** @property { number } - SMS verification configuration error */
    this.SMS_AUTH_CONFIG_ERROR = 9;
    /** @property { number } - SMS message failed to send */
    this.SMS_SEND_FAILED = 10;

    /** @enum { number } */
    this.LOGIN = {
        /** Invalid username or password */
        ACCOUNT_OR_PASSWORD_ERROR: 103,
        /** Error getting hall server */
        GET_HALL_SERVERS_FAIL: 104,
        /** Account already exists */
        ACCOUNT_EXIST: 105,
        /** Account doesn't exist */
        ACCOUNT_NOT_EXIST: 106,
        /** Invalid answer */
        ANSWER_ERROR: 107,
        /** Invalid password */
        PASSWORD_ERROR: 108,
    };

    /** @enum { number } */
    this.HALL = {
        /** Invalid token information */
        TOKEN_INFO_ERROR: 201,
        /** Invalid token */
        TOKEN_INVALID: 202,

        /** Token already signed */
        TODAY_ALREADY_SIGNED: 203,
        /** Token already shared */
        TODAY_ALREADY_SHARED: 204,

        /** No rewards to claim */
        NOT_SPREAD_REWARDS: 205,

        /** Not enough gold */
        NOT_ENOUGH_GOLD: 206,
        /** Not enough diamond */
        NOT_ENOUGH_DIAMOND: 207,

        /** User already in friend list */
        ALREADY_IN_FRIEND_LIST: 208,
        /** User already in request list */
        ALREADY_IN_REQUEST_LIST: 209,
        /** User not in friend list */
        NOT_IN_FRIEND_LIST: 210,
        /** User not in request list */
        NOT_IN_REQUEST_LIST: 211,
        /** User not found */
        NOT_FIND: 212,

        /** Maimum number of daily reviews reached */
        CAN_NOT_EVALUATE_TODAY: 213,
        /** Promotion ID has already been set */
        SPREAD_ID_ALREADY_SET: 214,
        /** Trade order doesn't exist */
        NOT_FIND_TRADE_ORDER: 215,
        /** Broadcast string too long */
        BROADCAST_STRING_TOO_LONG: 216,
        /** Phone number already bind */
        BIND_PHONE_ALREADY: 217,
        /** WX already bind */
        BIND_WX_ALREADY: 218,
        /** Didn't find trade info */
        TRADE_INFO_NOT_FIND: 219,
        /** Insufficient VIP level */
        NOT_ENOUGH_VIP_LEVEL: 220,
        /** Invited friend is offline */
        INVITED_FRIEND_OFFLINE: 221,

        /** Personal data can only be changed every 30 days */
        CAN_NOT_CHANGE_USER_INFO_BECAUSE_INTERVAL_TIME: 222,

        /** Too long nickname */
        NICKNAME_TO_LONG: 223,
        /** Account is frozen, no login */
        NO_LOGIN: 224,
        /** Already withdrawed cash today */
        TODAY_ALREADY_WITHDRAW_CASH: 225,
        /** No promoter */
        NOT_SPREADER: 226,
        /** Not enough coupons */
        NOT_ENOUGH_COUPON: 227,
        /** The user is already promoter */
        ALREADY_SPREADER: 228,
        /** You can't currently use gold coins */
        GOLD_LOCKED: 229,
        /** Invalid safe password */
        SAFE_PASSWORD_ERROR: 230,

        /** Ali pay isn't bind */
        NOT_BIND_ALI_PAY: 231,
        /** Bank card isn't bind */
        NOT_BIND_BANK_CARD: 232
    };

    /** @enum { number } */
    this.GAME_CENTER = {
        /** Can't match entering room */
        ENTERING_ROOM_CANT_MATCH: 301,
        /** Invalid game server parameter */
        GAME_SERVER_PARAMETER_ERROR: 302,
        /** Matching */
        MATCHING: 303,
        /** Entering room */
        ENTERING_ROOM: 304,
        /** Not in match queue */
        NOT_IN_MATCH_LIST: 305,
        /** Already in room, can't create a new room */
        ALREADY_IN_ROOM: 306,
        /** Error creating new room */
        CREATE_ROOM_ERROR: 307,
        /** Room doesn't exist */
        ROOM_NOT_EXIST:308,
        /** Room is full */
        ROOM_PLAYER_COUNT_FULL: 309,
        /** Error joining room */
        JOIN_ROOM_ERROR: 310,
        /** Not enough gold coins to enter the room */
        ENTRY_ROOM_FAIL_GOLD_NOT_ENOUGH: 311,
        /** Too many gold coins to enter the room */
        ENTRY_ROOM_FAIL_GOLD_TOO_MANY: 312,
        /** Already in match list, cannot rematch */
        ALREADY_IN_MATCH_LIST: 313,
    };

    /** @enum {number} */
    this.GAME = {
        /** Full room queue */
        ROOM_COUNT_REACH_LIMIT: 401,
        /** Insufficient gold coins to start the game */
        LEAVE_ROOM_GOLD_NOT_ENOUGH_LIMIT: 402,
        /** Unable to start the game, exceeded limit of gold coins */
        LEAVE_ROOM_GOLD_EXCEED_LIMIT: 403,
        /** Insufficient room rate */
        ROOM_EXPENSE_NOT_ENOUGH: 404,
        /** Room has been dissolved */
        ROOM_HAS_DISMISS: 405,
        /** Room has been dissolved, user should exit */
        ROOM_HAS_DISMISS_SHOULD_EXIT: 406,
        /** User can't leave the room */
        CAN_NOT_LEAVE_ROOM: 407,
    };

    /** @enum { number } */
    this.RECHARGE = {
        /** Recharge fail */
        RECHARGE_FAIL: 501,
        /** Recharge success */
        RECHARGE_SUCCESS: 502,
        /** Can't find user */
        USER_NOT_FIND: 503,
        /** Can't find item */
        ITEM_NOT_FIND: 504,
        /** Error checking signature */
        SIGN_CHECK_ERR: 505,
        /** Error checking money count */
        MONEY_COUNT_ERR: 506,
        /** Error checking item information */
        ITEM_INFO_ERR: 507,
        /** User payment failed */
        USER_PAYMENT_FAILED: 508
    };

    this[1] = '数据请求失败';
    this[2] = '请求数据错误';
    this[3] = '数据库操作错误';
    this[4] = '无效用户';
    this[5] = '发送参数错误';
    this[6] = '权限不足';
    this[7] = '短信验证码错误';
    this[8] = '图形验证码错误';
    this[9] = '短信验证配置信息错误';
    this[10] = '短信发送失败';

    this[103] = '账号或密码错误';
    this[104] = '获取大厅服务器失败';
    this[105] = '账号已存在';
    this[106] = '帐号不存在';
    this[107] = '密保问题答案错误';
    this[108] = '密码错误';

    this[201] = 'token信息错误';
    this[202] = 'token失效';
    this[203] = '今日已签到';
    this[204] = '今日已分享';
    this[205] = '没有可领取的推广奖励';
    this[206] = '金币不足';
    this[207] = '钻石不足';
    this[208] = '已经在好友列表中';
    this[209] = '已经在请求列表中';
    this[210] = '不在好友列表中';
    this[211] = '不再请求列表中';
    this[212] = '用户不存在';
    this[213] = '每日最多点踩、赞各10次';
    this[214] = '已设置过推广ID，无法重复设置';
    this[215] = '未查询到订单信息';
    this[216] = '发送内容过长，不能超过50个字符';
    this[217] = '该手机号已经绑定，不能重复绑定';
    this[218] = '该微信号已经绑定，不能重复绑定';
    this[219] = '订单不存在';
    this[220] = '会员等级不足';
    this[221] = '邀请的好友不在线';
    this[222] = '无法修改个人信息，修改间隔不得少于30天';
    this[223] = '昵称长度不能超过五个字符';
    this[224] = '帐号被冻结，禁止登录';
    this[225] = '每天只能提交一次退款申请，不能再次提交';
    this[226] = '请输入正确的邀请码';
    this[227] = '积分不足';
    this[228] = '该用户已经为推广员，无法重复设置';
    this[229] = '当前正在游戏中，无法进行金币操作，请退出游戏或等待游戏结束';
    this[230] = '保险柜密码错误';
    this[231] = '未绑定支付宝';
    this[232] = '未绑定银行卡';

    this[301] = '正在进入房间无法重新匹配';
    this[302] = '游戏服务器参数错误';
    this[303] = '正在匹配';
    this[304] = '正在进入房间';
    this[305] = '没有在匹配队列中';
    this[306] = '已经在房间中，无法创建新的房间';
    this[307] = '创建房间失败';
    this[308] = '房间不存在';
    this[309] = '房间人数已满';
    this[310] = '加入房间失败';
    this[311] = '金币不足无法进入房间';
    this[312] = '金币超过上线，无法进入房间';
    this[313] = '已经在匹配列表中，无法重复匹配';

    this[401] = '房间数量到达上线';
    this[402] = '金币低于房间的金币下限';
    this[403] = '金币超过房间的金币上限';
    this[404] = '房卡不足';
    this[405] = '房间已解散';
    this[406] = '房间已解散，请离开房间';
    this[407] = '当前正在游戏中，无法离开房间';

    this[500] = '请求超时';
    this[501] = '充值失败';
    this[502] = '充值成功';
};

module.exports = new Code();