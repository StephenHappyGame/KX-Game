/**
 * API for account management.
 * 
 * @category API
 * @exports AccountAPI
 */
var AccountAPI = module.exports = {};

/**
 * Attemps to login to the game server.
 * 
 * @param {string} account - account name
 * @param {string} password - password to account
 * @param {string} loginPlatform - login platform
 * @param {function} cbSuccess - callback function that will be invoked on success
 * @param {function} cbFail - callback function that will be invoked on failure
 * 
 * @see module:NetworkLogic.gameServerHttpRequest
 */
AccountAPI.login = function (account, password, loginPlatform, cbSuccess, cbFail) {
    let route = "/login";
    let requestData = {
        account: account,
        password: password,
        loginPlatform: loginPlatform
    };
    Global.NetworkLogic.gameServerHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

/**
 * Attempts to register the account.
 * 
 * @param {string} account - account name
 * @param {string} password - password to account
 * @param {string} loginPlatform - login platform
 * @param {string} smsCode - sms code
 * @param {function} cbSuccess - callback function that will be invoked on success
 * @param {function} cbFail - callback function that will be invoked on failure
 */
AccountAPI.register = function (account, password, loginPlatform, smsCode, cbSuccess, cbFail) {
    let route = "/register";
    let requestData = {
        account: account,
        password: password,
        loginPlatform: loginPlatform,
        smsCode: smsCode
    };
    Global.NetworkLogic.gameServerHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

/**
 * Attempts to reset password by phone request.
 * 
 * @param {string} account - account name
 * @param {string} newPassword - new password for the account
 * @param {string} smsCode - sms code
 * @param {any} imgCodeInfo - image code information
 * @param {string | null} cbRouter - router that will be receive response message
 */
AccountAPI.resetPasswordByPhoneRequest = function (account, newPassword, smsCode, imgCodeInfo, cbRouter) {
    var router = 'account.accountHandler.resetPasswordByPhone';
    var requestData = {
        account: account,
        newPassword: newPassword,
        smsCode: smsCode,
        imgCodeInfo: imgCodeInfo
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'ResetPasswordByPhoneResponse');
};