let utils = require("../../Shared/utils");

let FIRE_INTERVAL_TIME = 0.3;
let MAX_BULLET_COUNT = 30;
let AUTO_FIRE_CHANGE_TARGET_INTERVAL_TIME = 2;
let LOCK_FIRE_UPDATE_POS_INTERVAL_TIME = 1;

cc.Class({
    extends: cc.Component,

    properties: {
    },

    start () {
        this.fireTargetPoint = null;
        this.lastFireTime = 0;
        this.bulletCount = 0;
        this.stopAutoFireCallback = null;
        this.lockedFishCtrl = null;
        this.isOnLockFishState = false;
        this.selectLockFishCallback = null;

        this.robotOperationTimer = -1;

        // 机器人操作信息
        this.robotChairIDArr = [];
        this.robotFireCallback = null;
        this.robotFireRoteArr = [-1, -1 , -1 , -1];

        this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            this.onTouchEvent(cc.Node.EventType.TOUCH_START, this.node.convertTouchToNodeSpace(event.touch));
        }.bind(this));

        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            this.onTouchEvent(cc.Node.EventType.TOUCH_MOVE, this.node.convertTouchToNodeSpace(event.touch));
        }.bind(this));

        this.node.on(cc.Node.EventType.TOUCH_END, function () {
            this.onTouchEvent(cc.Node.EventType.TOUCH_END);
        }.bind(this));
    },

    onDestroy(){
        if (this.robotOperationTimer >= 0){
            clearInterval(this.robotOperationTimer);
            this.robotOperationTimer = -1;
        }
    },

    initWidget(fireCallback){
        this.fireCallback = fireCallback;
    },

    onTouchEvent: function (eventType, targetPoint) {
        if (this.isOnLockFishState){
            if (eventType === cc.Node.EventType.TOUCH_START){
                utils.invokeCallback(this.selectLockFishCallback, targetPoint);
            }
            return;
        }
        if(eventType === cc.Node.EventType.TOUCH_START){
            this.stopAutoFire();
            this.fireTargetPoint = targetPoint;
            this.onFire();
            this.schedule(this.onFire.bind(this), FIRE_INTERVAL_TIME);
        }else if (eventType === cc.Node.EventType.TOUCH_MOVE){
            this.fireTargetPoint = targetPoint;
        }else if (eventType === cc.Node.EventType.TOUCH_END){
            this.unscheduleAllCallbacks();
        }
    },
    
    onFire: function () {
        if(this.bulletCount >= MAX_BULLET_COUNT) return;
        if (Date.now() - this.lastFireTime <= FIRE_INTERVAL_TIME * 900) {
            console.log("fire fail interval time too short");
            return;
        }
        this.lastFireTime = Date.now();
        if (!!this.fireCallback){
            this.fireCallback(this.fireTargetPoint);
        }
    },

    bulletCountChange: function (changeCount) {
        this.bulletCount += changeCount;
    },
    
    autoFire: function (cb) {
        this.unscheduleAllCallbacks();

        this.autoSelectTarget();
        this.schedule(this.autoSelectTarget.bind(this), AUTO_FIRE_CHANGE_TARGET_INTERVAL_TIME);

        this.onFire();
        this.schedule(this.onFire.bind(this), FIRE_INTERVAL_TIME);

        this.stopAutoFireCallback = cb;
    },

    autoSelectTarget: function () {
        this.fireTargetPoint = cc.v2(0,0);
        this.fireTargetPoint.x = utils.getRandomNum(100, 1000);
        this.fireTargetPoint.y = utils.getRandomNum(100, 500);
    },
    
    stopAutoFire: function () {
        if (!this.stopAutoFireCallback) return;
        this.stopAutoFireCallback();
        this.stopAutoFireCallback = null;
        this.unscheduleAllCallbacks();
    },

    onChangeLockFishState: function (on, selectLockFishCallback) {
        this.isOnLockFishState = on;
        this.selectLockFishCallback = selectLockFishCallback || null;
    },
    
    startLockFire: function (fishCtrl) {
        if (!fishCtrl || !fishCtrl.node) return;
        this.unscheduleAllCallbacks();

        this.lockedFishCtrl = fishCtrl;

        this.lockTargetPos();
        this.schedule(this.lockTargetPos.bind(this), LOCK_FIRE_UPDATE_POS_INTERVAL_TIME);

        this.onFire();
        this.schedule(this.onFire.bind(this), FIRE_INTERVAL_TIME);
    },
    
    lockTargetPos: function () {
        if (!this.lockedFishCtrl || !this.lockedFishCtrl.node || this.lockedFishCtrl.isDestroyed){
            return;
        }
        this.fireTargetPoint = this.lockedFishCtrl.node.parent.convertToWorldSpaceAR(this.lockedFishCtrl.node.position);
    },
    
    stopLockFire: function () {
        this.lockedFishCtrl = null;
        this.unscheduleAllCallbacks();
    },
    
    startRobotOperation: function (robotChairIDArr, robotFireCallback) {
        if (this.robotOperationTimer >= 0){
            clearInterval(this.robotOperationTimer);
        }
        this.robotChairIDArr = robotChairIDArr;
        this.robotFireCallback = robotFireCallback;
        this.robotOperationTimer = setInterval(this.robotOperationScheduler.bind(this), FIRE_INTERVAL_TIME * 1000);
    },
    
    robotOperationScheduler: function () {
        let chairArr = [];
        let roteArr = [];
        for (let i = 0; i < this.robotChairIDArr.length; ++i){
            let chairID = this.robotChairIDArr[i];
            let rote = this.robotFireRoteArr[chairID];
            if (rote > 0){
                if (Math.random() < 0.05){
                    rote = utils.getRandomNum(20, 160);
                    this.robotFireRoteArr[chairID] = rote;
                }
            }else{
                rote = utils.getRandomNum(20, 160);
                this.robotFireRoteArr[chairID] = rote;
            }
            chairArr.push(chairID);
            roteArr.push(rote);
        }
        if (chairArr.length > 0){
            utils.invokeCallback(this.robotFireCallback, chairArr, roteArr);
        }
    },
    
    stopRobotOperation: function () {
        if (this.robotOperationTimer >= 0){
            clearInterval(this.robotOperationTimer);
            this.robotOperationTimer = -1;
        }
        this.robotChairIDArr = [];
        this.robotFireCallback = null;
    }
});
