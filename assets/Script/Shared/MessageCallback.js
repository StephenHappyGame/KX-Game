/**
 * Helper class used to register and unregister message handlers for any route.
 * It allows to emit message to all handlers for specified route.
 * 
 * @category Managers
 * @exports MessageCallback
 */
var MessageCallback = module.exports = {};

/**
 * @interface MessageListener
 * @property { function } messageCallbackHandler - Function invoked on receiving message
 * 
 * @category Managers
 */

/**
 * Adds the *handler* as a listener to the specified *route*.
 * To work properly, *handler* must have *messageCallbackHandler* method defined.
 * 
 * @param { string } route - route that will invoke the callback
 * @param { MessageListener } handler - object that contains messageCallbackHandler function
 */
MessageCallback.addListener = function (route, handler) {
    this.handlers = this.handlers || [];

    var handlers = this.handlers[route] || null;
    if (!!handlers){
        var isHandlerExist = false;
        for (var i in handlers){
            if (handlers.hasOwnProperty(i) && (handlers[i] === handler)){
                isHandlerExist = true;
                break;
            }
        }
        if (!isHandlerExist){
            handlers.push(handler);
        }
    } else {
        handlers = [];
        handlers.push(handler);
        this.handlers[route] = handlers;
    }
};

/**
 * Removes *handler* from the listeners on the specified *route*.
 * 
 * @param { string } route
 * @param { Object } handler - object to remove listener from
 */
MessageCallback.removeListener = function (route, handler) {
    this.handlers = this.handlers || [];
    var handlers = this.handlers[route] || null;
    if (!!handlers){
        for (var i = 0; i < handlers.length; ++i){
            if (handlers[i] === handler){
                handlers.splice(i,1);
                break;
            }
        }
    }
};

/**
 * Sends *msg* to all handlers for *route* that are valid objects and have *messageCallbackHandler*.
 * 
 * @param { string } route 
 * @param { any } msg - message that will be send to handlers
 */
MessageCallback.emitMessage = function (route, msg) {
    this.handlers = this.handlers || [];

    var handlers = this.handlers[route] || [];
    if (!!handlers) {
        console.log(`Pushed ${route} message`);
        //console.log(handlers);
        var handlersTemp = handlers.slice();
        for (var i in handlersTemp){
            if (handlersTemp.hasOwnProperty(i) && !!handlersTemp[i].messageCallbackHandler && !handlersTemp[i].isDestroy){
                handlersTemp[i].messageCallbackHandler(route, msg);
            }
        }
    }
};