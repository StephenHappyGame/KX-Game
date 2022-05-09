let gameProto = require('./GameProtoZJH');

cc.Class({
    extends: cc.Component,

    properties: {
        timeBg: cc.Node,
        timeText: cc.Label,

        stakeBtn: cc.Node,
        autoStakeBtn: cc.Node,
        cancelAutoStakeBtn: cc.Node,
        lookCardBtn: cc.Node,
        compareBtn: cc.Node,
        addStakeBtn: cc.Node
    },

    setEventCallback: function (cb) {
        this.callback = cb;
    },

    hideAutoEff: function () {
        /*this.autoLabel.string = '自动跟注';
        this.autoEffImg.node.stopAllActions();
        this.autoEffImg.node.active = false;*/

        this.autoStakeBtn.active = true;
        this.cancelAutoStakeBtn.active = false;

        this.autoStake = false;
    },

    showAutoEff: function () {
        /*this.autoLabel.string = "取消自动";
        this.autoEffImg.node.active = true;
        this.autoEffImg.node.runAction(cc.repeatForever(cc.rotateBy(0.5, 180, 180)));*/

        this.autoStakeBtn.active = false;
        this.cancelAutoStakeBtn.active = true;
        this.autoStake = true;
    },

    showSpecialOperationUI: function () {
        this.node.active = true;

        if (this.autoStake) {
            this.scheduleOnce(function () {
                Global.Utils.invokeCallback(this.callback(null,  'stake'));
            }.bind(this), 1);
            return;
        }
        //
        // let anim = this.getComponent(cc.Animation);
        // let animState = anim.play('showSpecialUI');
        // animState.wrapMode = cc.WrapMode.Normal;
        //
        this.startCountDown();
        this.addStakeBtn.active = true;
        this.stakeBtn.active = true;
        this.lookCardBtn.active = true;
        this.compareBtn.active = true;
        this.autoStakeBtn.active = false;
        this.cancelAutoStakeBtn.active = false;
    },

    showNormalOperationUI: function () {
        this.node.active = true;
        this.addStakeBtn.active = false;
        this.stakeBtn.active = false;
        this.lookCardBtn.active = false;
        this.compareBtn.active = false;
        this.autoStakeBtn.active = true;

        this.stopCountDown();

        if (this.autoStake) {
            this.autoStakeBtn.active = false;
            this.cancelAutoStakeBtn.active = true;
            return;
        }
        //
        // let anim = this.getComponent(cc.Animation);
        // let animState = anim.play('showSpecialUI');
        // animState.wrapMode = cc.WrapMode.Reverse;
    },

    updateStakeLevel: function (stakeLevel, multiple) {
        this.currentStakeLevel = stakeLevel || this.currentStakeLevel;
        this.currentMultiple = multiple || this.currentMultiple;

        /*this.autoStakeNum.string = proto.STAKE_LEVEL[this.currentStakeLevel] * this.currentMultiple;
        this.stakeNum.string = proto.STAKE_LEVEL[this.currentStakeLevel] * this.currentMultiple;
        this.compareStakeNum.string = proto.STAKE_LEVEL[this.currentStakeLevel] * this.currentMultiple;*/

        // this.compareBtn.interactable = data.canCompare;
        // this.compareBtn.interactable = true;
    },

    startCountDown: function () {
        cc.log('开始下注倒计时');
        this.stopCountDown();

        this.timeBg.active = true;
        let time = gameProto.OPERATION_TIME;
        this.timeText.string = time;
        this.schedule(function () {
            time -= 1;
            if (time >= 0) {
                this.timeText.string = time;
            } else {
                if (this.timeBg.active) {
                    Global.Utils.invokeCallback(this.callback(null,  'giveUp'));
                }
                this.stopCountDown();
            }
        }.bind(this), 1);
    },

    stopCountDown: function () {
        cc.log('停止下注倒计时');

        this.timeBg.active = false;
        this.unscheduleAllCallbacks();
    },

    // use this for initialization
    onLoad: function () {
        this.reSet();
    },

    onDestroy: function () {
        this.stopCountDown();
    },

    reSet: function () {
        //this.autoLabel.string = '自动加注';

        this.currentStakeLevel = 0;
        this.currentMultiple = 1;
        this.autoStake = false;
        this.timeBg.active = false;
        this.stopCountDown();

        this.hideAutoEff();
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
