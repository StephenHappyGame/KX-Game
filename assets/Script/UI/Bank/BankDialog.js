// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        inGroup: cc.Node,
        outGroup: cc.Node,
        goldNum: cc.Label,
        bankGoldNum: cc.Label,

        outSlider: cc.Slider,
        outProgress: cc.ProgressBar,
        outEdit: cc.EditBox,

        inSlider: cc.Slider,
        inProgress: cc.ProgressBar,
        inEdit: cc.EditBox,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    showInGroup: function () {
        this.inGroup.active = true;
        this.outGroup.active = false;
    },

    showOutGroup: function () {
        this.inGroup.active = false;
        this.outGroup.active = true;
    },

    updateGold () {
        this.goldNum.string = Math.floor(Global.Player.gold).toString();
        this.bankGoldNum.string = Math.floor(Global.Player.safeGold).toString();
    },

    updateEditText () {
        let inProgress = this.inSlider.progress;
        let outProgress = this.outSlider.progress;
        this.inEdit.string = Math.floor(inProgress * Global.Player.getPy('gold'));
        this.outEdit.string = Math.floor(outProgress * Global.Player.getPy('safeGold'));
    },

    updateProgress () {
        let inNum = this.inEdit.string;
        let outNum = this.outEdit.string;
        if (inNum === '') {
            this.inSlider.progress = 0;
            this.inProgress.progress = 0;
        } else {
            inNum = parseInt(inNum);
            this.inSlider.progress = inNum / parseInt(Global.Player.getPy('gold'));
            this.inProgress.progress = inNum / parseInt(Global.Player.getPy('gold'));
        }
        if (parseInt(Global.Player.getPy('gold')) === 0) {
            this.inSlider.progress = 0;
            this.inProgress.progress = 0;
        }

        if (outNum === '') {
            this.outSlider.progress = 0;
            this.outProgress.progress = 0;
        } else {
            outNum = parseInt(outNum);
            this.outSlider.progress = outNum / parseInt(Global.Player.getPy('safeGold'));
            this.outProgress.progress = outNum / parseInt(Global.Player.getPy('safeGold'));
        }
        if (parseInt(Global.Player.getPy('safeGold')) === 0) {
            this.outSlider.progress = 0;
            this.outProgress.progress = 0;
        }
    },

    start () {
        this.inProgress.progress = 0;
        this.outProgress.progress = 0;
        this.showInGroup();
        this.updateGold();
        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
    },

    onDestroy () {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    },

    messageCallbackHandler: function(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.updateGold();
                this.updateEditText();
                break;
        }
    },

    editEnd (event, param) {
        switch (param) {
            case 'in':
                let inNum = this.inEdit.string;

                if (inNum === '') {
                } else {
                    inNum = parseInt(inNum);
                    if (inNum > Global.Player.getPy('gold')) {
                        this.inEdit.string = Global.Player.getPy('gold');
                    }
                }
                break;
            case 'out':
                let outNum = this.outEdit.string;
                if (outNum === '') {
                } else {
                    outNum = parseInt(outNum);
                    if (outNum > Global.Player.getPy('safeGold')) {
                        this.outEdit.string = Global.Player.getPy('safeGold');
                    }

                    if (outNum === 0) {
                        this.outEdit.string = 0;
                    }
                }
                break;
        }

        this.updateProgress();
    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
            case 'in':
                this.showInGroup();
                break;
            case 'out':
                this.showOutGroup();
                break;
            case 'clear':
                if (this.inGroup.active) {
                    this.inEdit.string = '';
                } else {
                    this.outEdit.string = '';
                }
                this.updateProgress();
                break;
            case 'confirm_in':
                let inNum = this.inEdit.string;
                if (inNum === '') {
                    Global.DialogManager.addTipDialog('请输入！');
                    return;
                }

                inNum = parseInt(inNum);
                if (inNum <= 0) {
                    Global.DialogManager.addTipDialog('请输入0以上的数字！');
                    return;
                }

                if (inNum > Global.Player.getPy('gold')) {
                    Global.DialogManager.addTipDialog('您携带的金额不足！');
                    return;
                }

                Global.API.hall.safeBoxOperationRequest(parseInt(inNum), null, function () {
                    Global.DialogManager.addPopDialog('存入成功！');
                    this.inEdit.string = '';
                    this.updateProgress();
                }.bind(this));
                break;
            case 'confirm_out':
                let outNum = this.outEdit.string;
                if (outNum === '') {
                    Global.DialogManager.addTipDialog('请输入！');
                    return;
                }

                outNum = parseInt(outNum);
                if (outNum <= 0) {
                    Global.DialogManager.addTipDialog('请输入0以上的数字！');
                    return;
                }

                if (outNum > Global.Player.getPy('safeGold')) {
                    Global.DialogManager.addTipDialog('保险柜金额不足！');
                    return;
                }

                Global.API.hall.safeBoxOperationRequest(parseInt(outNum) * -1, null, function () {
                    Global.DialogManager.addTipDialog('取出成功！');
                    this.outEdit.string = '';
                    this.updateProgress();
                }.bind(this));
                break;
            case 'in_slider':
                this.inProgress.progress = event.progress;
                this.updateEditText();
                break;
            case 'out_slider':
                this.outProgress.progress = event.progress;
                this.updateEditText();
                break;
            case 'inMax':
                this.inSlider.progress = 1;
                this.inProgress.progress = 1;
                this.updateEditText();
                break;
            case 'outMax':
                this.outSlider.progress = 1;
                this.outProgress.progress = 1;
                this.updateEditText();
                break;
        }
    }

    // update (dt) {},
});
