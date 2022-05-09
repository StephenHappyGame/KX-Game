/**
 * API for receiving phone codes.
 * 
 * @category API
 * @exports HttpAPI
 */
var HttpAPI = module.exports = {};

/**
 * Attempts to get phone code from the game server (probably by messaging specified *phoneNumber*).
 * 
 * @param {string} phoneNumber
 * @param {function} cbSuccess - callback function that will invoke on success 
 * @param {function} cbFail - callback function that will invoke on failure
 */
HttpAPI.getPhoneCode = function (phoneNumber, cbSuccess, cbFail) {
    let route = "/getSMSCode";
    let requestData = {
        phoneNumber: phoneNumber,
    };

    Global.NetworkLogic.gameServerHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};