/**
 * Conatins all useful enumartions.
 * 
 * @category Constants
 * @exports Enum
 */
var Enum = module.exports;

/**
 * Literal translation from chinese comments.
 * 
 * @enum { number }
 */
Enum.gameType = {
    /** Zhajinhua */
    ZJH: 1,
    /** Niu Niu */
    NN: 10,
    /** Hundereds of cattle */
    BRNN: 11,
    /** Thirteen waters */
    SSS: 20,
    /** Pusher */
    TTZ: 30,
    /** Red and black war */
    HHDZ: 40,
    /** Blackjack */
    BJL: 50,
    /** Dragon and Tiger fight  */
    LHD: 60,
    /** Fishing */
    FISH: 70,
    /** Fighting the Landlord */
    DDZ: 80,
    /** 21 o'clock */
    BJ: 90,
    /** Texas Hold'em */
    DZ: 100,
    /** Runs fast */
    PDK: 110
};

/**
 * Type of a broadcast.
 * 
 * @enum { number }
 */
Enum.broadcastType = {
    /** None */
    NONE: 0,
    /** Loop */
    LOOP: 1,
    /** System */
    SYSTEM: 2,
    /** Win the jackopt */
    BIG_WIN: 3
};

/**
 * Room settlement method.
 * 
 * @enum { number }
 */
Enum.roomSettlementMethod = {
    /** None */
    NONE: 0,
    /** Gold coin mode */
    GOLD: 1,
    /** Score mode */
    SCORE: 2,
    /** Limited gold mode */
    LIMIT_GOLD: 3
};

/**
 * Type of the room.
 * 
 * @enum { number }
 */
Enum.roomType = {
    /** None */
    NONE: 0,
    /** Normal room */
    NORMAL: 1,
    /** Private room */
    PRIVATE: 2,
    /** Room for 100 */
    HUNDRED: 3
};

/**
 * Type of the update data.
 * 
 * @enum { number }
 */
Enum.updateDataType = {
    /** None */
    NONE: 0,
    /** Add */
    ADD: 1,
    /** Remove */
    REMOVE:2,
    /** Update */
    UPDATE: 3
};

/**
 * Gender of the player.
 * 
 * @enum { number }
 */
Enum.PlayerSex = {
    /** Man */
    MAN: 0,
    /** Woman */
    WOMAN: 1
};

/**
 * Login platform.
 * 
 * @enum { number }
 */
Enum.loginPlatform = {
    /** None */
    NONE: 0,
    /** Account */
    ACCOUNT: 1,
    /** WEI XIN */
    WEI_XIN: 2,
    /** Mobile phone */
    MOBILE_PHONE: 3
};

/**
 * User room state.
 * 
 * @enum { number }
 */
Enum.userRoomState = {
    /** None */
    NONE: 0,
    /** Entering */
    ENTERING: 1,
    /** In room */
    IN_ROOM: 2
};

/**
 * Game room status.
 * 
 * @enum { number }
 */
Enum.gameRoomStatus = {
    /** None */
    NONE: 0,
    /** Free */
    FREE: 1,
    /** Playing */
    PLAYING: 2
};

/**
 * Game room start type.
 * 
 * @enum { number }
 */
Enum.gameRoomStartType = {
    /** None */
    NONE: 0,
    /** All ready */
    ALL_READY: 1,
    /** Auto start */
    AUTO_START: 2
};

/**
 * User online status.
 * 
 * @enum { number }
 */
Enum.userOnlineStatus = {
    /** None */
    NONE: 0,
    /** Offline */
    OFF_LINE: 1,
    /** Online */
    ON_LINE: 2
};

/**
 * Game room chat content type.
 * 
 * @enum { number }
 */
Enum.gameRoomChatContentType = {
    /** None */
    NONE: 0,
    /** Emotion */
    EMOTION: 1,
    /** Quick text */
    QUICK_TEXT: 2,
    /** Text */
    TEXT: 3,
    /** Voice */
    VOICE: 4
};

/** 
 * Voice type.
 * 
 * @enum { string }
 */
Enum.VOICE = {
    /** Putonghua */
    PU_TONG_HUA: 'putonghua',
    /** Ganzhouhua */
    GAN_ZHOU_HUA: 'ganzhouhua'
};

/**
 * Shop type.
 * 
 * @enum { number }
 */
Enum.ShopType = {
    /** None */
    NONE: 0,
    /** Shop gold */
    SHOP_GOLD: 1,
    /** Shop diamond */
    SHOP_DIAMOND:2
};

/**
 * Room user status.
 * 
 * @enum { number }
 */
Enum.RoomUserStatus = {
    /** None */
    NONE: 0,
    /** Online */
    ONLINE: 1,
    /** Offline */
    OFFLINE: 2
};

/**
 * Payment type.
 * 
 * @enum { number }
 */
Enum.PAY_TYPE = {
    /** None */
    NONE: 0,
    /** Alipay */
    ALI_PAY: 1,
    /** WeChat */
    WE_CHAT: 2,
    /** QQPay */
    QQ_PAY: 3,
    /** UnionPay */
    UNION_PAY: 4
};

/**
 * Recharge platform.
 * 
 * @enum { number }
 */
Enum.RechargePlatform = {
    /** None */
    NONE: 0,
    /** Alipay */
    ALI: 1,
    /** WeChat */
    WX: 2,
    /** An Xuontong */
    ANXEN_PAY: 3
};

/**
 * System platform.
 * 
 * @enum { number }
 */
Enum.SystemPlatform = {
    /** None */
    NONE: 0,
    /** Android */
    ANDROID: 1,
    /** IOS */
    IOS: 2,
    /** Web */
    WEB: 3
};

/**
 * User permission type.
 * 
 * @enum { number }
 */
Enum.userPermissionType = {
    /** None */
    NONE: 0,
    /** Login client */
    LOGIN_CLIENT:                   0x0001,
    /** Login admin */
    LOGIN_MT:                       0x0002,
    /** User management */
    USER_MANAGER:                   0x0004,
    /** System management */
    USER_SYSTEM_MANAGER:            0x0008,
    /** Exchange management */
    EXCHANGE_MANAGER:               0x0010,
    /** Promotion management */
    SPREAD_MANAGER:                 0x0020,
    /** Game management */
    GAME_MANAGER:                   0x0040,
    /** Data manager (statistics) */
    DATA_MANAGER:                   0x0080,
    /** Game control */
    GAME_CONTROL:                   0x0100
};

/**
 * Email status.
 * 
 * @enum { number }
 */
Enum.emailStatus = {
    /** None */
    NONE: 0,
    /** Didn't receive */
    NOT_RECEIVE: 1,
    /** Received */
    RECEIVED: 2
};

/**
 * Exchange record status.
 * 
 * @enum { number }
 */
Enum.exchangeRecordStatus = {
    /** None */
    NONE: 0,
    /** In stock */
    WAIT_DELIVERY: 1,
    /** Shipped */
    ALREADY_DELIVERY: 2
};

/**
 * Order status.
 * 
 * @enum { number }
 */
Enum.orderStatus = {
    /** Not processed */
    WAIT_HANDLE: 0,
    /** Processed */
    ALREADY_HANDLE: 1
};

/**
 * Record type.
 * 
 * @enum { number }
 */
Enum.recordType = {
    /** None */
    NONE: 0,
    /** Recharge */
    RECHARGE: 1,
    /** Withdrawals */
    WITHDRAWALS: 2,
    /** Game */
    GAME: 3,
    /** Registration */
    LOGIN: 4,
    /** Withdraw commission */
    EXTRACT_COMMISSION: 5,
    /** Game */
    GAME_PROFIT: 6,
    /** Inventory extraction */
    EXTRACT_INVENTORY: 7,
    /** Grand admin privileges */
    ADMIN_GRANT: 8
};

/**
 * Type of withdraw cash.
 * 
 * @enum { number }
 */
Enum.withdrawCashType = {
    /** None */
    NONE: 0,
    /** Alipay */
    ALI_PAY: 1,
    /** Bank card */
    BANK_CARD: 2
};