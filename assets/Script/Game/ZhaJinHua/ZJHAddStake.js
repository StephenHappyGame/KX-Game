var proto = require('./GameProtoZJH');
var ZJHAudio = require('./ZJHAudio');

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...

        //加注数值显示
        stakeLevelLabel: {
            type: [cc.Label],
            default: []
        },

        //4个加注按钮
        addStakeBtn: {
            type: [cc.Button],
            default: []
        }
    },

    onBtnClk: function (event, param) {
        if (this.currentStakeLevel < parseInt(param[param.length - 1])) {
            if (parseInt(param[param.length - 1]) === 4) {
                ZJHAudio.jiaZhuMax();
            } else {
                ZJHAudio.jiaZhu();
            }
        } else {
            ZJHAudio.genZhu();
        }

        switch (param) {
            case 'stakeLevel1':
                Global.Utils.invokeCallback(this.stakeCallback, 1);
                break;
            case 'stakeLevel2':
                Global.Utils.invokeCallback(this.stakeCallback, 2);
                break;
            case 'stakeLevel3':
                Global.Utils.invokeCallback(this.stakeCallback, 3);
                break;
            case 'stakeLevel4':
                Global.Utils.invokeCallback(this.stakeCallback, 4);
                break;
        }
    },

    startSelectStake: function (currentStakeLevel, currentMultiple, cb) {
        this.currentStakeLevel = currentStakeLevel;
        for (let i = 0; i < this.stakeLevelLabel.length; i ++) {
            this.stakeLevelLabel[i].string = proto.STAKE_LEVEL[i + 1] * currentMultiple;
            if (i < currentStakeLevel - 1) {
                this.addStakeBtn[i].interactable = false;
            }

            if (proto.STAKE_LEVEL[i + 1] * currentMultiple >= Global.Player.gold) {
                this.addStakeBtn[i].interactable = false;
            }
        }
        this.stakeCallback = cb;
    },

    // use this for initialization
    onLoad: function () {

    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
