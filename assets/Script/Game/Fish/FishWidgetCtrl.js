let utils = require("../../Shared/utils");
let gameProto = require("./API/gameProto");
let fishConfig = require("./API/fishConfig");
cc.Class({
    extends: cc.Component,

    properties: {
        fishSprite: cc.Sprite,

        fishShadowSprite: cc.Sprite,

        fishCollider: cc.BoxCollider,
        isDestroyed:false
    },


    start () {
        this.lastPos = this.node.position;

        this.fishSpriteFrameArr = this.fishSpriteFrameArr || [];

        this.startMove();

        this.startAnimation();

        this.listenerOutSenceEvent = false;
    },

    onDestroy(){
        if (!!this.showBeShotTimer){
            clearTimeout(this.showBeShotTimer);
        }
    },

    initWidget(fishInfo, curServerTime, isShouldFixed, callback){
        this.fishInfo = fishInfo;
        this.fishID = fishInfo.fishID;
        this.pathData = this.getPathData(fishInfo.pathArr, isShouldFixed);
        this.fishTypeInfo = fishConfig.fishType[fishInfo.fishTypeID];
        this.curServerTime = curServerTime;

        let urlArr = [];
        for (let i = 1; i <= this.fishTypeInfo.frameCount; ++i){
            urlArr.push("Fish/Fish/fish" + this.fishTypeInfo.resIndex + "_" + i);
        }
        cc.loader.loadResArray(urlArr, cc.SpriteFrame, function (err, spriteFrameArr) {
            if (!!err){
                console.error(err);
            }else{
                if(!this.node) return;
                this.fishSpriteFrameArr = spriteFrameArr;
                if(this.fishSpriteFrameArr.length > 0){
                    let spriteFrame = spriteFrameArr[0];
                    let rect = spriteFrame.getRect();
                    this.fishSprite.spriteFrame = spriteFrame;
                    this.node.width = rect.width;
                    this.node.height = rect.height;

                    this.fishCollider.size.width = this.node.width;
                    this.fishCollider.size.height = this.node.height;

                    this.fishSprite.node.width = this.node.width;
                    this.fishSprite.node.height = this.node.height;

                    this.fishShadowSprite.node.width = this.node.width;
                    this.fishShadowSprite.node.height = this.node.height;
                }
            }
        }.bind(this));

        if (!this.pathData){
            console.error("fish path data err");
            return;
        }
        //console.log(this.pathData)
        this.node.position = this.pathData.pointArr[0];
        this.callback = callback;
    },

    getPathData(pathArr, isShouldFixed){
        for (var a = 0; a < pathArr.length; ++a) {
            pathArr[a] = cc.v2(pathArr[a].x, pathArr[a].y),
            isShouldFixed && (pathArr[a].x *= -1, pathArr[a].y *= -1);
        }
        return {
            time: (Global.Utils.getDist(pathArr[0], pathArr[1]) + Global.Utils.getDist(pathArr[1], pathArr[2])) / fishConfig.fishMoveBaseSpeed,
            pointArr: pathArr
        } 
    },

    startMove(){
        this.lastPos = this.node.position;
        var moveSpeed = this.fishTypeInfo.moveSpeed || 1;
        this.fishInfo.tide && (moveSpeed = fishConfig.fishTideMoveSpeed);
        let bezierToAction = cc.bezierTo(this.pathData.time/moveSpeed, this.pathData.pointArr);
        let action = cc.sequence([
            bezierToAction,
            cc.callFunc(function () {
                if (!!this.callback){
                    this.callback(this, "leave");
                }
            }.bind(this))
        ]);
        this.bezierToAction = action;
        this.node.runAction(action);
        let dt = (this.curServerTime - this.fishInfo.createTime)/1000;
        if (dt > 0){
            action.step(0);
            action.step(dt);
        }
    },

    startAnimation(){
        let curIndex = 0;
        let spriteFrameCount = this.fishTypeInfo.frameCount;
        this.schedule(function () {
            curIndex = (curIndex + 1)%spriteFrameCount;
            if (!!this.fishSpriteFrameArr[curIndex]){
                this.fishSprite.spriteFrame = this.fishSpriteFrameArr[curIndex];

                this.fishShadowSprite.spriteFrame = this.fishSpriteFrameArr[curIndex];
            }
        }.bind(this), 0.05 / this.fishTypeInfo.animationSpeed);
    },

    // 被打中
    onBeShot(){
        if (!!this.showBeShotTimer){
            clearTimeout(this.showBeShotTimer);
        }
        this.fishSprite.node.color = new cc.Color(255, 100, 100, 255);
        this.showBeShotTimer = setTimeout(function () {
            this.fishSprite.node.color = new cc.Color(255, 255, 255, 255);
        }.bind(this), 1000);
    },

    // 被捕获
    onCapture(cb){
        this.isDestroyed = true;
        this.node.stopAllActions();
        this.fishCollider.enabled = false;
        this.unscheduleAllCallbacks();
        this.fishShadowSprite.node.active = false;
        //this.bossRoundNode && (this.bossRoundNode.active = false);
        this.fishSprite.node.color = new cc.Color(255, 100, 100, 255);
        //this.toadBaseNode && (this.toadBaseNode.color = new cc.Color(255, 100, 100, 255));
        this.node.runAction(cc.sequence(cc.repeat(cc.sequence([cc.rotateBy(0.1, 120), cc.rotateBy(0.2, -120)]), 5), cc.callFunc(function () {
            this.onRemove();
            Global.Utils.invokeCallback(cb);
        }.bind(this))))
    },

    onRemove(){
        this.isDestroyed = true;
        this.node.destroy();
    },

    // 开始监听鱼移除屏幕消息
    listenerOutScene: function (isStart) {
        this.listenerOutSenceEvent = isStart;
    },
    onTideStart: function () {
        this.isInScene() ? this.bezierToAction.speed(10) : this.onRemove()
    },
    isInScene: function () {
        let node = this.node;
        if (!node) return false;
        let parent = this.node.parent;
        return !(node.x > parent.width * 0.5 || node.x < parent.width * -0.5 || node.y > parent.height * 0.5 || node.y < parent.height * -0.5);
    },

    onClear: function () {
        this.isDestroyed = true;
        if (!!this.showBeShotTimer){
            clearTimeout(this.showBeShotTimer);
        }
        this.node.stopAllActions();

        this.node.destroy();
    },
    update(){
        // 更新游动方向
        if (!this.isDestroyed) {
            if (!this.fishTypeInfo.fixedRotation){
                let unitVector = utils.getUnitVector(this.lastPos, this.node.position);
                if (unitVector.x !== 0 || unitVector.y !== 0){
                    this.node.rotation = Math.acos(unitVector.x)/Math.PI * -180;
                    if (unitVector.y < 0){
                        this.node.rotation *= -1;
                    }
                    //this.fishShadowSprite.node.rotation = this.fishSprite.node.rotation;
                    this.lastPos = this.node.position;
                }
            }else{
                if(!this.fishTypeInfo.fixedDir){
                    let unitVector = utils.getUnitVector(this.lastPos, this.node.position);
                    if (unitVector.x >= 0){
                        this.node.scaleX = 1;
                    }else{
                        this.node.scaleX = -1;
                    }
                }
            }
            // 计算鱼是否移动出去
            if(this.listenerOutSenceEvent){
                if (!this.isInScene()){
                    utils.invokeCallback(this.callback, this, "outScene");
                    this.listenerOutSenceEvent = false;
                }
            }

        }
       
    }
});
