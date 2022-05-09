// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

let gameProto = require('./DZProto');
let CHANGE_GOLD_SHOW_TIME = 3;
cc.Class({
    extends: cc.Component,

    properties: {
        nicknameLabel: cc.Label,
        goldLabel: cc.Label,
        avatar: cc.Sprite,
        timeDown: cc.ProgressBar,

        winGoldLabel: cc.Label,
        loseGoldLabel: cc.Label,

        operationTypeNode: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },
    
    initWidget: function (userInfo) {
        this.node.active = true;

        this.userInfo = userInfo;
        this.nicknameLabel.string = Global.Player.convertNickname(userInfo.nickname);
        this.goldLabel.string = Global.Utils.formatNumberToString(userInfo.takeGold, 2);
        Global.CCHelper.updateSpriteFrame(userInfo.avatar, this.avatar);
    },

    updateGold: function (gold) {
        if (!this.userInfo) return;
        this.userInfo.takeGold = gold;
        this.goldLabel.string = Global.Utils.formatNumberToString(gold, 2);
    },

    addGold: function (count, isTween) {
        if (!this.userInfo) return;
        this.userInfo.takeGold += count;
        this.goldLabel.string = Global.Utils.formatNumberToString(this.userInfo.takeGold, 2);
        if (!isTween) return;
        let label = Global.Utils.formatNumberToString(count, 2) + "元";
        if(count > 0){
            label = "+" + label;
            this.winGoldLabel.string = label;
            this.winGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 20)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
        }else{
            this.loseGoldLabel.string = label;
            this.loseGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 20)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
        }
    },

    getGold: function () {
        return !this.userInfo?0:this.userInfo.takeGold;
    },

    setStatus: function (userStatus) {
        if (userStatus === gameProto.userStatus.NONE){
            this.node.active = false;
        }else if (userStatus === gameProto.userStatus.PLAYING){
            this.node.active = true;
            this.node.opacity = 255;
        }else if (userStatus === gameProto.userStatus.GIVE_UP){
            this.node.active = true;
            this.node.opacity = 200;
        }
    },
    
    setOperation: function (operationType) {
        if (this.operationType === gameProto.operationType .ALL_IN || this.operationType === gameProto.operationType.GIVE_UP) return;
        this.operationType = operationType;
        let name = "";
        if (operationType === gameProto.operationType.ADD_BET) name = "add";
        else if (operationType === gameProto.operationType.PASS) name = "pass";
        else if (operationType === gameProto.operationType.FLOW) name = "flow";
        else if (operationType === gameProto.operationType.ALL_IN) name = "allin";
        else if (operationType === gameProto.operationType.GIVE_UP) name = "giveup";
        for (let i = 0; i < this.operationTypeNode.children.length; ++i){
            let node = this.operationTypeNode.children[i];
            node.active = (node.name === name);
        }
    },
    
    startClock: function (time, cb) {
        this.totalTime = time;
        this.curTime = time;
        this.unscheduleAllCallbacks();

        this.timeDown.progress = 1;
        this.timeDown.node.active = true;

        this.schedule(function (dt) {
            this.curTime -= dt;
            if (this.curTime >= 0)this.timeDown.progress = this.curTime/this.totalTime;
            else {
                this.unscheduleAllCallbacks();
                this.timeDown.node.active = false;
                Global.Utils.invokeCallback(cb, 0);
            }
        }.bind(this), 1/30);
    },

    stopClock: function () {
        this.unscheduleAllCallbacks();
        this.timeDown.node.active = false;
    },

    getCenterPos: function () {
        return this.node.parent.convertToWorldSpaceAR(this.node.position);
    },
    
    resetWidget: function () {
        this.userInfo = null;
        this.stopClock();

        this.winGoldLabel.node.stopAllActions();
        this.winGoldLabel.node.y = 0;
        this.winGoldLabel.node.active = false;

        this.loseGoldLabel.node.stopAllActions();
        this.loseGoldLabel.node.y = 0;
        this.loseGoldLabel.node.active = false;

        this.node.opacity = 255;

        this.operationType = gameProto.operationType.NONE;
        this.setOperation(gameProto.operationType.NONE);
    },
    
    clearWidget: function () {
        this.stopClock();

        this.winGoldLabel.node.stopAllActions();
        this.winGoldLabel.node.y = 0;
        this.winGoldLabel.node.active = false;

        this.loseGoldLabel.node.stopAllActions();
        this.loseGoldLabel.node.y = 0;
        this.loseGoldLabel.node.active = false;

        this.node.opacity = 255;

        this.operationType = gameProto.operationType.NONE;
        this.setOperation(gameProto.operationType.NONE);
    }
});
