var networkManager = require('./NetworkManager');
var messageCallback = require('./MessageCallback');
var dialogManager = require('./DialogManager');
var constant = require('./Constant');
var utils = require('./utils');
var code = require('./code');

/**
 * Handles all network logic.
 * It reroutes **ServerMessagePush** messages, by getting the *pushRouter* and emitting the message
 * to all *pushRouter* listeners and will handle disconnection and reconnection of the server.
 * It can be used to send game server http requests.
 * 
 * *NetworkManager* listeners:
 * - **ServerDisconnection** for **close** route - it means that **ServerDisconnection** route listeners will be invoked after
 * message on **close** route.
 * - **ServerMessagePush** for **ServerMessagePush** route
 * 
 * *MessageCallback* listeners:
 * - **ServerDisconnection**
 * - **ServerMessagePush**
 * - **PopDialogContentPush**
 * 
 * @category Managers
 * @exports NetworkLogic
 */
var NetworkLogic = module.exports;

/** 
 * Indicates if server connection was closed manually.
 * 
 * @type { boolean }
 */
NetworkLogic.isManualCloseServerConnection = false;

/**
 * Initializes network listeners.
 */
NetworkLogic.init = function() {
    NetworkLogic.isManualCloseServerConnection = false;

    /// 添加事件监听
    messageCallback.addListener('ServerDisconnection', this);
    messageCallback.addListener('ServerMessagePush', this);
    messageCallback.addListener('PopDialogContentPush', this);

    networkManager.removeAllListeners();
    /// 服务器推送消息监听
    // 监听断开信息
    networkManager.addReceiveListen('close', 'ServerDisconnection');
    // 推送消息
    networkManager.addReceiveListen('ServerMessagePush', 'ServerMessagePush');
};

/**
 * Removes network message listeners **ServerDisconnection**, **ServerMessagePush**, **PopDialogContentPush**.
 */
NetworkLogic.deInit = function() {
    /// 添加事件监听
    messageCallback.removeListener('ServerDisconnection', this);
    messageCallback.removeListener('ServerMessagePush', this);
    messageCallback.removeListener('PopDialogContentPush', this);
};

/**
 * Connects to PomeloJS server.
 * 
 * @param { string } host - host of the server
 * @param { string } port - port of the server
 * @param { function } cb - callback function that will be invoked after connection
 * 
 * @see {@link module:NetworkManager.init}
 */
NetworkLogic.connectToServer = function(host, port, cb) {
    networkManager.init({
        host: host,
        port: port
    }, cb);
};

/**
 * Disconnect from the server.
 * Will try to reconnect if *autoReconnect* is true.
 * 
 * @param {boolean} autoReconnect 
 * 
 * @see {@link module:NetworkManager.disconnect}
 */
NetworkLogic.disconnect = function(autoReconnect) {
    NetworkLogic.isManualCloseServerConnection = !autoReconnect;
    networkManager.disconnect();
};

/**
 * Uses account API to try to login into the with *data*.
 * It will invoke *cbSuccess* on success and *cbFail* on failure.
 * 
 * @param { object } data - login data, has to contain *account*, *password* and *loginPlatform* fields
 * @param { string } data.account - UID of the account
 * @param { string } data.password - Password of the account
 * @param { module:Enum.loginPlatform } data.loginPlatform - Platform used to login
 * @param { function } cbSuccess - Callback function that will be invoked on success
 * @param { Function } cbFail - Callback function that will be invoked on failure
 */
NetworkLogic.login = function(data, cbSuccess, cbFail) {
    Global.API.account.login(data.account, data.password, data.loginPlatform,
        function (data) {
            // login successfull
            NetworkLogic.connectToServer(data.msg.serverInfo.host, data.msg.serverInfo.port, function () {
                NetworkLogic.loginHall(data.msg.token, null, cbSuccess);
            })
        },
        cbFail
    );
};

/**
 * Uses account API to register user with specified *data* and *userInfo*.
 * It will invoke *cbSuccess* on success and *cbFail* on failure.
 * 
 * @param { object } data - login data, has to contain *account*, *password*, *loginPlatform* and *smsCode* fields
 * @param { string } data.account - UID of the account
 * @param { string } data.password - Password of the account
 * @param { module:Enum.loginPlatform } data.loginPlatform - Platform used to login
 * @param { string } data.smsCode - SMS Code used to register
 * @param { object } userInfo - contains user information 
 * @param { function } cbSuccess - callback function that will be invoked on success
 * @param { function } cbFail - callback function that will be invoked on failure
 */
NetworkLogic.register = function(data, userInfo, cbSuccess, cbFail) {
    Global.API.account.register(data.account, data.password, data.loginPlatform, data.smsCode,
        function (data) {
            // 登录成功
            NetworkLogic.connectToServer(data.msg.serverInfo.host, data.msg.serverInfo.port, function () {
                NetworkLogic.loginHall(data.msg.token, userInfo, cbSuccess);
            })
        },
        cbFail
    );
};

/**
 * Logins to hall using hall API entry function.
 * 
 * @param { string } token - token used for identification
 * @param { object | null } userInfo - user info used for initializing the player (it can be *null* if it's not a register attempt)
 * @param { function } cbSuccess - function that will be invoked on success
 */
NetworkLogic.loginHall = function(token, userInfo, cbSuccess) {
    Global.API.hall.entry(token, userInfo, function (data) {
        //游戏数据初始化
        Global.Data.init(data.msg.publicParameter);
        //玩家数据初始化
        Global.Player.init(data.msg.userInfo);
        //游戏类型数据初始化
        Global.GameTypes.init(data.msg.gameTypes);
        //代理数据初始化
        Global.AgentProfit.init(data.msg.agentProfit);

        Global.DialogManager.removeLoadingCircle();

        utils.invokeCallback(cbSuccess, data);

        Global.MessageCallback.emitMessage('ReConnectSuccess');
    }, function () {
        // 进入大厅失败，断开服务器
        NetworkLogic.disconnect(false);
        Global.DialogManager.addPopDialog("进入大厅失败");
    })
};

/**
 * Reconnects to the server.
 * Invoked *cb* on success and error.
 * 
 * @param {function} cb - callback function
 */
NetworkLogic.reconnection = function(cb) {
    let account = cc.sys.localStorage.getItem('account');
    let password = cc.sys.localStorage.getItem('password');
    let loginPlatform = parseInt(cc.sys.localStorage.getItem('platform'));
    if (!account || !password || !loginPlatform){
        dialogManager.addPopDialog("与服务器断开连接，请重新登录", function(){
            cc.game.restart();
        });
    }else{
        NetworkLogic.login({
            account: account,
            password: password,
            loginPlatform: loginPlatform
        }, function (data) {
            utils.invokeCallback(cb, data);
        }, function () {
            utils.invokeCallback(cb, {code: 1});
        });
    }
};

/**
 * Message callback handler.
 * It will be used by `MessageCallback` to process the messages.
 * 
 * @param {string} router - route that invoked the callback
 * @param {any} data - received message
 */
NetworkLogic.messageCallbackHandler = function(router, data) {
    if (router === 'PopDialogContentPush') {
        if (!!Global.Code[data.code]) {
            Global.DialogManager.addPopDialog(Global.Code[data.code]);
        } else {
            Global.DialogManager.addPopDialog('游戏错误，错误码：' + data.code);
        }
    } else if (router === 'PopDialogTextPush') {
        Global.DialogManager.addPopDialog(data.text);
    } else if (router === 'ServerMessagePush') {
        if (!data.pushRouter){
            console.error('ServerMessagePush push router is invalid:'+ data);
            return;
        }
        messageCallback.emitMessage(data.pushRouter, data);
    } else if (router === 'ServerDisconnection') {
        // 如果不是手动断开则执行断线重连
        if(!NetworkLogic.isManualCloseServerConnection) {
            Global.DialogManager.addLoadingCircle();
            setTimeout(function () {
                NetworkLogic.reconnection(function (data) {
                    if(!data || data.code !== 0) {
                        dialogManager.addPopDialog("与服务器断开连接，请重新登录", function() {
                            cc.game.restart();
                        });
                    } else {
                        NetworkLogic.isManualCloseServerConnection = false;
                    }
                });
            }, 2000);
        } else {
            NetworkLogic.isManualCloseServerConnection = false;
        }
    }
};

/**
 * Sends HTTP request to the game server.
 * URL is deducted from *gameServerAddress* from `Constant` object and *route*.
 * 
 * @param {string} route - route of the request
 * @param {string} method - method used for request
 * @param {any} data - data to send
 * @param {function} cbSuccess - callback function invoked when successfull
 * @param {function} cbFail - callback function invoked when failure
 */
NetworkLogic.gameServerHttpRequest = function(route, method, data, cbSuccess, cbFail) {
    let url = constant.gameServerAddress + route;
    let params = {
        url: url,
        method: method,
        data: data,
        cb: function(err, response) {
            if (!!err){
                if(!!cbFail) {
                    utils.invokeCallback(cbFail);
                } else {
                    Global.DialogManager.removeLoadingCircle();
                    Global.DialogManager.addPopDialog("网络异常，请检查网络连接");
                }
            }else {
                if(response.code !==0) {
                    if(!!cbFail) {
                        utils.invokeCallback(cbFail, response);
                    } else {
                        Global.DialogManager.removeLoadingCircle();
                        Global.DialogManager.addPopDialog(code[response.code] + "");
                    }
                } else {
                    utils.invokeCallback(cbSuccess, response);
                }
            }
        }
    };
    Global.CCHelper.httpRequest(params);
};