var messageCallback = require('./MessageCallback');

/**
 * 
 * The class is used to manage PomeloJS connection, send messages and notifications,
 * and add / remove route listeners.
 * 
 * @category Managers
 * @exports NetworkManager
 */
var NetworkManager = module.exports = {};

/**
 * Initializes `NetworkManager`, by initializing PomeloJS connection.
 * 
 * @param {object} params - object with *host* and *port* member
 * @param {function} cb - callback function that will invoke after initialization
 */
NetworkManager.init = function (params,cb) {
    pomelo.init({
        host: params.host,
        port: params.port,
        log: true
    }, cb);
};

/**
 * Disconnects PomeloJS connection.
 */
NetworkManager.disconnect = function () {
    pomelo.disconnect();
};

/**
 * Sends request message *msg* to PomeloJS server *route*.
 * If *cbSuccess* is a function, it will invoke it after successfull request.
 * If *cbSuccess* is a name, it will emit message with `Message.emitMessage` to the *cbSuccess* route.
 * If error was encountered, it will invoke *cbFail* callback.
 * 
 * @param {string} route - route to request
 * @param {string} msg - request message
 * @param {function | string} cbSuccess - function that will be invoked on success, or name of the route that
 * receive message through `MessageCallback.emitMessage`
 * @param {function} cbFail - failure callback
 */
NetworkManager.request = function (route, msg, cbSuccess, cbFail) {
    console.log(`NetworkManager.request: ${route}`);
    console.log("Sending:");
    console.log(msg);

    pomelo.request(route, msg, function (data) {
        //console.log('Request code: ' + (((typeof cbSuccess) === 'string') ? cbSuccess : route));
        console.log("Received:");
        console.log(data);

        if (data.code !== Global.Code.OK) {
            Global.DialogManager.removeLoadingCircle();

            if (!!cbFail && (typeof (cbFail) === 'function')){
                cbFail(data);
                return;
            }
            if (!!Global.Code[data.code]) {
                Global.DialogManager.addPopDialog(Global.Code[data.code]);
            } else {
                Global.DialogManager.addPopDialog('游戏错误，错误码：' + data.code);
            }
        }else{
            if (!!cbSuccess){
                if (typeof(cbSuccess) === 'function') {
                    cbSuccess(data);
                }else{
                    messageCallback.emitMessage(cbSuccess, data);
                }
            }
        }
    });
};

/**
 * Exactly the same as `NetworkManager.request`.
 * 
 * @param {string} route - route to request
 * @param {string} msg - request message
 * @param {function | string} cbRoute - function that will be invoked on success, or name of the route that
 * receive message through `MessageCallback.emitMessage`
 * @param {function} cbFail - failure callback
 * 
 * @see {@link NetworkManager.request}
 */
NetworkManager.send = function (route, msg, cbRoute, cbFail) {
    this.request(route, msg, cbRoute, cbFail);
};

/**
 * Notifies specified *route* with message *msg*.
 * 
 * @param {string} route - route to notify
 * @param {object} msg - notification message
 */
NetworkManager.notify = function (route, msg){
    console.log('Notify:' + route);
    console.log(msg);
    pomelo.notify(route, msg);
};

/**
 * Adds receive listener *cbRoute* for *route*.
 * When the server receives message on *route* it will emit received message to
 * *cbRoute* route with `MessageCallback.emitMessage`.
 * 
 * @param {string} route - route to add listener to
 * @param {string} cbRoute - route to emit message to
 * @returns {function} Returns newly created push callback function.
 */
NetworkManager.addReceiveListen = function (route, cbRoute) {
    cbRoute = cbRoute || route;
    let pushCallback = function (msg) {
        if (!!cbRoute){
            //console.log('push:' + cbRoute);
            //console.log(msg);
            messageCallback.emitMessage(cbRoute, msg);
        }
    };
    pomelo.on(route, pushCallback);
    return pushCallback;
};

/**
 * Removes specified *callback* from the *route*.
 * 
 * @param {string} route - route to remove callback from
 * @param {function} callback - callback function to remove
 */
NetworkManager.removeListener = function (route, callback){
    pomelo.removeListener(route, callback);
};

/**
 * Removes all listeners from all routes.
 */
NetworkManager.removeAllListeners = function (){
    pomelo.removeAllListeners();
};