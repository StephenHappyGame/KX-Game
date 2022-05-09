let utils = require("./utils");

/**
 * Helper module.
 * 
 * @category Utilities
 * @exports CCHelper
 */
let exp = module.exports = {};

exp.createFrameAnimationNode = function (res, cb) {
    cc.loader.loadRes(res + "_config", cc.JsonAsset, function (err, data) {
        if (!!err){
            cc.error("createFrameAnimation err: load file fail url=" + res + '.json');
            cb("load file fail");
        }else{
            data = data.json;
            let width = data["width"] || 0;
            let height = data["height"] || 0;
            let count = data["count"] || 0;
            let intervalTime = (data["intervalTime"] || 0);
            if (width <= 0 || height <= 0 || count <= 0 || intervalTime <= 0){
                cc.error("animation data err");
                cb("animation data err");
                return;
            }
            cc.loader.loadRes(cc.url.raw(res + '.png'), function (err, texture) {
                if (!!err){
                    cc.error("createFrameAnimation err: load file fail url=" + res + '.png');
                    cb("load file fail");
                }else{
                    let wCount = Math.floor(texture.width/width) || 1;
                    let hCount = Math.floor(texture.height/height) || 1;

                    let node = new cc.Node();
                    let sprite = node.addComponent(cc.Sprite);
                    sprite.spriteFrame = new cc.SpriteFrame(texture, new cc.Rect(0, 64, width, height));
                    /**
                     * @param loop 是否循环，默认false
                     * @param speed 播放速度，默认1
                     * @param completeCallback，每完成一次的回调
                     */
                    node.startAnimation = function (loop, speed, completeCallback) {
                        if (!speed || speed <= 0) speed = 1;
                        intervalTime = intervalTime/speed;
                        node.stopAllActions();
                        let index = 0;
                        function callback() {
                            let curIndex = index++ % data.count;
                            let rect = new cc.Rect((curIndex%wCount) * width, Math.floor(curIndex/hCount) * height, width, height);
                            sprite.spriteFrame = new cc.SpriteFrame(texture, rect);
                            if(!!completeCallback && (curIndex === (data.count - 1))){
                                completeCallback();
                            }
                        }
                        if (!!loop){
                            node.runAction(cc.repeatForever(cc.sequence([cc.delayTime(intervalTime), cc.callFunc(callback)])));
                        }else{
                            node.runAction(cc.repeat(cc.sequence([cc.delayTime(intervalTime), cc.callFunc(callback)]), data.count));
                        }
                    };
                    node.stopAnimation = function () {
                        node.stopAllActions();
                    };
                    cb(null, node);
                }
            })
        }
    });
};

// 获取单位向量
exp.getUnitVector = function (startPoint, endPoint) {
    let point = cc.v2(0, 0);
    let distance;
    distance = Math.pow((startPoint.x - endPoint.x), 2) + Math.pow((startPoint.y - endPoint.y),2);
    distance = Math.sqrt(distance);
    if(distance === 0) return point;
    point.x = (endPoint.x - startPoint.x)/distance;
    point.y = (endPoint.y - startPoint.y)/distance;
    return point;
};

exp.getRelativePosition = function (childNode, parentNode) {
    return parentNode.convertToNodeSpace(childNode.parent.convertToWorldSpace(childNode.position));
};

//检查是不是微信浏览器
exp.isWechatBrowser = function () {
    //安卓的微信webview由qq浏览器x5内核提供技术支持，所以加BROWSER_TYPE_MOBILE_QQ
    return false;
    //return (cc.sys.browserType === cc.sys.BROWSER_TYPE_WECHAT || cc.sys.browserType === cc.sys.BROWSER_TYPE_MOBILE_QQ);
};

exp.setPageTitle = function(titleText) {
    if(!cc.sys.isBrowser) return;
    document.title = titleText;
};

//跨域图片或者本地图片
exp.updateSpriteFrame = function (imgUrl, target_, cb) {
    let target = target_;
    if ((imgUrl && imgUrl.indexOf('http') >= 0)) {
        cc.loader.load({url: imgUrl, type: "png"}, function (err, texture) {
            if (!!err) {
                cc.error(err);
                utils.invokeCallback(cb, err);
            } else {
                if (target.isValid) {
                    target.spriteFrame = new cc.SpriteFrame(texture);
                    utils.invokeCallback(cb);
                }
            }
        });
        //加载本地图片
    } else {
        cc.loader.loadRes(imgUrl, cc.SpriteFrame, function (err, spriteFrame){
            if (!!err){
                cc.log(err);
                utils.invokeCallback(cb, err);
            }else{
                if (target.isValid){
                    target.spriteFrame = spriteFrame;
                    utils.invokeCallback(cb);
                }
            }
        });
    }
};

exp.loadRes = function (dirArr, cb) {
    let loadingCount = 0;
    for (let i = 0; i < dirArr.length; i ++) {
        cc.loader.loadResDir(dirArr[i], function (err) {
            loadingCount += 1;
            if (loadingCount >= (dirArr.length)) {
                utils.invokeCallback(cb, err);
            }
        }.bind(this));
    }
};

exp.releaseRes = function (dirArr) {
    for (let i = 0; i < dirArr.length; i ++) {
        cc.loader.releaseResDir(dirArr[i]);
    }
};

exp.createSpriteNode = function (src) {
    let node = new cc.Node();
    let sprite = node.addComponent(cc.Sprite);
    sprite.spriteFrame = new cc.SpriteFrame();
    exp.updateSpriteFrame(src, sprite);
    return node;
};

/**
 * Callback for httpRequest function.
 * 
 * @callback HttpRequestCallback
 * @param { int | null } errorCode - If error occured, it will contain error code.
 * @param { any } response - If no error, it will contain received response.
 */

/**
 * Sends XMLHttpRequest to the specified url. Invokes passed callback on success and error.
 * 
 * @param { Object } params - Request parameters
 * @param { string } params.url - Full request URL
 * @param { string } [params.method] - Request method, default value "GET"
 * @param { string } [params.responseType] - Request response type, default value "json"
 * @param { module:CCHelper~HttpRequestCallback } [params.cb] - Request callback, can be skipped
 */
exp.httpRequest = function (params) {
    cc.log(`HTTP Request: ${params.url}`);
    cc.log('Request sending:');
    cc.log(params.data);

    let urlStr = params.url;
    let methodStr = params.method || 'GET';
    let responseType = params.responseType || 'json';
    //let withCredentials = params.withCredentials || false;

    let xhr = new XMLHttpRequest();
    xhr.responseType = responseType;
    xhr.onload = function () {
        cc.log('Request received:');
        cc.log(xhr.response);

        if (xhr.status === 200){
            utils.invokeCallback(params.cb, null, xhr.response);
        }else{
            cc.error("Request failed status: " + xhr.status);
            utils.invokeCallback(params.cb, Global.Code.FAIL);
        }
    };

    xhr.timeout = 20000;
    xhr.ontimeout = function () {
        // XMLHttpRequest 超时。在此做某事。
        cc.error("Request timeout");
        Global.DialogManager.removeLoadingCircle();
        utils.invokeCallback(params.cb, Global.Code.FAIL);
    };
    xhr.onerror = function (e) {
        cc.error("Request error");
        Global.DialogManager.removeLoadingCircle();
        utils.invokeCallback(params.cb, Global.Code.FAIL);
    };

    xhr.open(methodStr, urlStr, true);
    xhr.setRequestHeader("CONTENT-TYPE", "application/x-www-form-urlencoded");
    //xhr.withCredentials = withCredentials;

    if (!!params.data) {
        let data = "";
        for (let key in params.data) { // convert object to xml parameters
            if (params.data.hasOwnProperty(key)) {
                if (data.length > 0) {
                    data += "&";
                }
                data += (key + "=" + params.data[key]);
            }
        }

        if(data.length > 0){
            xhr.send(data);
        } else{
            xhr.send();
        }
    } else {
        xhr.send();
    }
};

exp.screenShoot = function (cb) {
    if (!cc.sys.isNative) return;
    if (CC_JSB) {
        let dirpath = jsb.fileUtils.getWritablePath() + 'ScreenShoot/';
        if (!jsb.fileUtils.isDirectoryExist(dirpath)) {
            jsb.fileUtils.createDirectory(dirpath);
        }
        let name = 'ScreenShoot-' + (new Date()).valueOf() + '.png';
        let filepath = dirpath + name;
        let size = cc.visibleRect;
        let rt = cc.RenderTexture.create(size.width, size.height);
        cc.director.getScene()._sgNode.addChild(rt);
        rt.setVisible(false);
        rt.begin();
        cc.director.getScene()._sgNode.visit();
        rt.end();
        rt.saveToFile('ScreenShoot/' + name, cc.ImageFormat.PNG, true, function () {
            cc.log('save succ');
            rt.removeFromParent(true);
            utils.invokeCallback(cb, null, filepath);
        });
    }
};

// 截屏
exp.capScreen = function(node) {
    if (CC_JSB) {
        let width = cc.visibleRect.width;
        let height = cc.visibleRect.height;
        let renderTexture = cc.RenderTexture.create(width, height);
        node.parent._sgNode.addChild(renderTexture);

        renderTexture.begin();
        node._sgNode.visit();
        renderTexture.end();
        let url = Date.now() + ".png";
        renderTexture.saveToFile(url, cc.ImageFormat.PNG, true, function () {
            node.parent._sgNode.removeChild(renderTexture);
        });
    }
};

// 刷新对齐
exp.updateNodeAlignment = function (node) {
    let widget = node.getComponent(cc.Widget);
    if (!!widget){
        widget.updateAlignment();
    }
    for (let i = 0; i < node.children.length; ++i) {
        exp.updateNodeAlignment(node.children[i]);
    }
};

// 屏幕适配
exp.screenAdaptation = function (baseSize, canvas) {
    let size = new cc.size(baseSize.width, baseSize.height);
    let frameSize = cc.view.getFrameSize();
    /*if (size.height/size.width < frameSize.height/frameSize.width){
        size.height = size.width * (frameSize.height / frameSize.width);
    } else {
        return;
    }*/
    //size.width = size.height * (frameSize.width/frameSize.height);
    if (size.height/size.width < frameSize.height/frameSize.width){
        //size.height = size.width * (frameSize.height / frameSize.width);`
        canvas.fitHeight = false;
        canvas.fitWidth = true;
    } else{
        size.width = size.height * (frameSize.width/frameSize.height);
        canvas.designResolution = size;

        canvas.node.width = size.width;
        canvas.node.height = size.height;
    }

    if(cc.sys.isNative || true) return;
    cc.view.setResizeCallback(function (){
        size = new cc.size(baseSize.width, baseSize.height);
        frameSize = cc.view.getFrameSize();
        if (size.height/size.width < frameSize.height/frameSize.width){
            size.height = size.width * (frameSize.height / frameSize.width);
        } else{
            size.width = size.height * (frameSize.width/frameSize.height);
        }
        canvas.designResolution = size;
        canvas.node.width = size.width;
        canvas.node.height = size.height;

        Global.MessageCallback.emitMessage("DesignResolutionChanged", size);

        exp.updateNodeAlignment(canvas.node);
    });
};

exp.playPreSound = function () {
    cc.loader.loadRes('Sound/button', function (err, clip) {
        if (!!err) {} else {
            cc.audioEngine.play(clip, false, 0);
        }
    });
};