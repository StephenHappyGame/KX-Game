var exp = module.exports;

// -----------------------玩家操作----------------------
exp.GAME_FIRE_NOTIFY                        = 301;
exp.GAME_FIRE_PUSH                          = 401;

exp.GAME_CHANGE_CANNON_NOTIFY               = 302;
exp.GAME_CHANGE_CANNON_PUSH                 = 402;

exp.GAME_CAPTURE_NOTIFY                     = 303;
exp.GAME_CAPTURE_PUSH                       = 403;

exp.GAME_LOCK_FISH_NOTIFY                   = 304;
exp.GAME_LOCK_FISH_PUSH                     = 404;

exp.GAME_ROBOT_FIRE_NOTIFY                  = 305;
exp.GAME_ROBOT_FIRE_PUSH                    = 405;

exp.GAME_ROBOT_CAPTURE_NOTIFY               = 306;
exp.GAME_ROBOT_CAPTURE_PUSH                 = 406;
exp.GAME_TIDE_START_PUSH                 = 406;

// ----------------------游戏状态-----------------------
exp.GAME_ADD_FISH_PUSH                      = 305;


exp.gameFireNotify = function (rote) {
    return {
        type: this.GAME_FIRE_NOTIFY,
        data: {
            rote: rote
        }
    };
};

exp.gameFirePush = function (chairID, rote) {
    return {
        type: this.GAME_FIRE_PUSH,
        data: {
            rote: rote,
            chairID: chairID
        }
    };
};

exp.gameChangeCannonNotify = function (powerIndex) {
    return {
        type: this.GAME_CHANGE_CANNON_NOTIFY,
        data: {
            powerIndex: powerIndex
        }
    };
};

exp.gameChangeCannonPush = function (chairID, powerIndex) {
    return {
        type: this.GAME_CHANGE_CANNON_PUSH,
        data: {
            chairID: chairID,
            powerIndex: powerIndex
        }
    };
};

exp.gameCaptureNotify = function (fishID) {
    return {
        type: this.GAME_CAPTURE_NOTIFY,
        data: {
            fishID: fishID
        }
    };
};

exp.gameCapturePush = function (chairID, fishID, gainGold, curWinGold) {
    return {
        type: this.GAME_CAPTURE_PUSH,
        data: {
            fishID: fishID,
            chairID: chairID,
            gainGold: gainGold,
            curWinGold: curWinGold
        }
    };
};

exp.gameAddFishPush = function (fishArr) {
    return {
        type: this.GAME_ADD_FISH_PUSH,
        data: {
            fishArr: fishArr
        }
    };
};

exp.gameLockFishNotify = function (fishID) {
    return {
        type: this.GAME_LOCK_FISH_NOTIFY,
        data: {
            fishID: fishID
        }
    };
};

exp.gameLockFishPush = function (chairID, fishID) {
    return {
        type: this.GAME_LOCK_FISH_PUSH,
        data: {
            chairID: chairID,
            fishID: fishID
        }
    };
};

exp.gameRobotFireNotify = function (chairIDArr, roteArr) {
    return {
        type: this.GAME_ROBOT_FIRE_NOTIFY,
        data: {
            chairIDArr: chairIDArr,
            roteArr: roteArr
        }
    };
};

exp.gameRobotCaptureNotify = function (chairID, fishID) {
    return {
        type: this.GAME_ROBOT_CAPTURE_NOTIFY,
        data: {
            chairID: chairID,
            fishID: fishID
        }
    };
};