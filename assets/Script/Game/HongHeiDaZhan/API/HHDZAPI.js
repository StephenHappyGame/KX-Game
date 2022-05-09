let gameProto = require('./HHDZGameProto');

let api = module.exports;

api.stake = function (data) {
    let router = 'game.gameHandler.gameMessageNotify';
    let msg = {
        type: gameProto.GAME_OPERATE_STAKE_NOTIFY,
        data: data
    };
    Global.NetworkManager.notify(router, msg);
};