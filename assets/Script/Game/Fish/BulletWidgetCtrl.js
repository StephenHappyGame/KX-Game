let utils = require('../../Shared/utils');

let BULLET_MOVE_SPEED = 500;
cc.Class({
    extends: cc.Component,

    properties: {
    },

    start () {
        this.isDestroyed = false;
    },
    
    initWidget: function (chairID, cannonType, captureCallback) {
        this.ownerChairID = chairID;
        this.cannonType = cannonType;
        this.captureCallback = captureCallback;
    },

    emit: function (cannonPos, mathRote, targetFish) {
        let unitVector = {x: Math.cos(mathRote / 180 * Math.PI), y: Math.sin(mathRote / 180 * Math.PI)};

        this.node.x = cannonPos.x + unitVector.x * 100;
        this.node.y = cannonPos.y + unitVector.y * 100;

        this.node.rotation = mathRote * -1 + 90;

        this.unitVector = unitVector;
        this.targetFish = targetFish;

        if (this.targetFish){
            this.schedule(this.updateDir.bind(this), 1/30);
        }else{
            let moveBy = new cc.Vec2(unitVector.x  * 1000, unitVector.y * 1000);
            this.node.runAction(cc.moveBy(1000/BULLET_MOVE_SPEED, moveBy));
        }
    },

    onCollisionEnter: function (other) {
        if (this.isDestroyed) return;
        let type = other.node.group;
        if (type === "wall"){
            if (this.targetFish){
                this.targetFish = null;
            }
            let node = other.node;
            if (node.name === "top" || node.name === "bottom"){
                this.unitVector.y *= -1;
            }else{
                this.unitVector.x *= -1;
            }
            let moveBy = new cc.Vec2(this.unitVector.x  * 3000, this.unitVector.y * 3000);
            this.node.stopAllActions();
            this.node.runAction(cc.moveBy(3000/BULLET_MOVE_SPEED, moveBy));
            // 修改方向
            this.node.rotation = (Math.acos(this.unitVector.x)/Math.PI * -180 + 90);
            if (this.unitVector.y < 0) this.node.rotation = (this.node.rotation - 90) * -1 + 90;
        }else if (type === "fish"){
            let fishCtrl = other.node.getComponent("FishWidgetCtrl");
            if (!fishCtrl) return;
            // 过滤鱼
            if (!!this.targetFish && !!this.targetFish.node && this.targetFish !== fishCtrl) return;
            // 处理鱼被击中事件
            this.captureCallback(this, fishCtrl);
        }
    },
    
    onShootFish: function () {
        this.isDestroyed = true;
        this.unscheduleAllCallbacks();
        this.node.destroy();
    },
    
    updateDir: function (dt) {
        if (!!this.targetFish && !!this.targetFish.node  && !this.targetFish.isDestroyed){
            this.unitVector = utils.getUnitVector(this.node.position, this.targetFish.node.position);

            let mathRote = Math.acos(this.unitVector.x) * 180 / Math.PI;
            if (this.unitVector.y < 0) mathRote *= -1;
            this.node.rotation = mathRote * -1 + 90;

            this.node.x += (BULLET_MOVE_SPEED * dt * this.unitVector.x);
            this.node.y += (BULLET_MOVE_SPEED * dt * this.unitVector.y);
        }else{
            this.targetFish = null;
            this.unscheduleAllCallbacks();
            let moveBy = new cc.Vec2(this.unitVector.x  * 1000, this.unitVector.y * 1000);
            this.node.runAction(cc.moveBy(1000/BULLET_MOVE_SPEED, moveBy));
        }
    }
});
