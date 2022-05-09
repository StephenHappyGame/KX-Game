/** 
 * API for room and game motifications.
 * 
 * @category API
 * @exports RoomAPI
 */
var RoomAPI = module.exports;

/**
 * Notifies room on **game.gameHandler.roomMessageNotify** route with *data*.
 * 
 * @param {any} data - data to send 
 */
RoomAPI.roomMessageNotify = function(data) {
    var router = 'game.gameHandler.roomMessageNotify';
    Global.NetworkManager.notify(router, data);

};

/**
 * Notifies room on **game.gameHandler.gameMessageNotify** route with *data.
 * 
 * @param {any} data - data to send 
 */
RoomAPI.gameMessageNotify = function(data) {
    var router = 'game.gameHandler.gameMessageNotify';
    Global.NetworkManager.notify(router, data);

};
