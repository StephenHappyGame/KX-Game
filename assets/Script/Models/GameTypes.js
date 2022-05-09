/**
 * Holds information about all available game types.
 * Mostly unused.
 * 
 * @category Models
 * @exports GameTypes
 */
let GameTypes = module.exports = {};

/**
 * Initialize with *data* (received from server).
 * 
 * @param {any} - Recevied game types.
 */
GameTypes.init = function (data) {
    console.log("gaemTypes");
    console.log(data);
    this.allGames = data;
};

//参数
//进游戏game
//游戏类型(gameType)
//游戏房间ID
//玩家uid
//若参数为0，则表示不存在
//state=game_1_100001_100001
GameTypes.setState = function (state) {
    console.log(`GameTypes.setState: ${state}`);
    if (!!state) {
        this.stateParams = state.split('_');
        if (this.stateParams[0] === 'game') {
            this.setCurrentKind(this.stateParams[1]);
        }
    }
};

GameTypes.getJoinRoomID = function () {
    let roomID = this.stateParams[2];
    if (!!roomID && parseInt(roomID) !== 0) {
        return roomID;
    }
    return false;
};

GameTypes.getAddFriendUid = function () {
    let uid = this.stateParams[3];
    if (!!uid && parseInt(uid) !== 0) {
        return uid;
    }
    return false;
};

GameTypes.clearState = function () {
    this.setState('game_' + this.getCurrentGameTypeID());
};

GameTypes.setCurrentKind = function (kind) {
    console.log(`setCurrentKind ${kind}`);
    this.kind = parseInt(kind);
};

GameTypes.getCurrentKind = function () {
    return this.kind;
};

GameTypes.getCurrentGameType = function () {
    return this.kind;
};

GameTypes.getCurrentGameTypeID = function () {
    for (let k in this.allGames) {
        if (this.allGames.hasOwnProperty(k)) {
            if (this.allGames[k].kind === this.kind) {
                return k;
            }
        }
    }
    return false;
};

GameTypes.getGameInfoByGameTypeID = function (gameTypeID) {
    for (let i = 0; i < this.allGames.length; ++i){
        if (this.allGames[i].gameTypeID === gameTypeID) return this.allGames[i];
    }
    return null;
};

GameTypes.getCUrrentGameInfo = function () {
    return this.allGames[this.getCurrentGameTypeID()];
};











GameTypes.getAllGames = function () {
    return Global.Constant.gameTypesConf;
};

GameTypes.getLevelsByKind = function (kind) {
    let levels = [];

    for(let key in this.allGames)
    {
        if (this.allGames.hasOwnProperty(key))
        {
            if (this.allGames[key].kind === kind) {
                levels.push(this.allGames[key]);
            }
        }
    }

    // levels.sort(function (a, b) {
    //     return a.level > b.level;
    // });
    for (let i = 0; i < levels.length - 1; i ++) {
        for (let j = i + 1; j < levels.length; j ++) {
            if (levels[i].level > levels[j].level) {
                let tmp = levels[i];
                levels[i] = levels[j];
                levels[j] = tmp;
            }
        }
    }

    return levels;
};

GameTypes.getGameConfByKind = function (kind) {
    for (let key in Global.Constant.gameTypesConf) {
        if (Global.Constant.gameTypesConf.hasOwnProperty(key)) {
            if (Global.Constant.gameTypesConf[key].kind === kind) {
                return Global.Constant.gameTypesConf[key];
            }
        }
    }
};

GameTypes.getGameInfoByKindAndLevel = function(kind, level){
    for (let key in this.allGames) {
        if (this.allGames.hasOwnProperty(key)) {
            if ((this.allGames[key].kind === kind) && (this.allGames[key].level === level)) {
                return this.allGames[key];
            }
        }
    }
    return null;
};