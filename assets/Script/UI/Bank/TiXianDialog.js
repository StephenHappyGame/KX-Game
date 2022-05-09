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

        goldText: cc.Label,
        outTip: cc.Label,
        outNumEdit: cc.EditBox,

        outProgress: cc.ProgressBar,
        outSlider: cc.Slider,

        zbfGroup: cc.Node,
        zbfAccountText: cc.Label,

        wxGroup: cc.Node,
        wxAccountText: cc.Label,

        bankCardGroup: cc.Node,
        bankCardText: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    showBindGroup (group) {
        this.zbfGroup.active = group === 'ali';
        this.wxGroup.active = group === 'wx';
        this.bankCardGroup.active = group === 'bankCard';
    },

    updatePlayerInfoUI () {
        this.goldText.string = Global.Player.getPy('gold');

        let aliInfo = JSON.parse(Global.Player.getPy('aliPayInfo')|| "{}");
        if (!!aliInfo && !!aliInfo.aliPayAccount && aliInfo.aliPayAccount !== '') {
            this.zbfAccountText.string = aliInfo.aliPayAccount;
        }

        let bankInfo = JSON.parse(Global.Player.getPy('bankCardInfo') || "{}");
        if (!!bankInfo && !!bankInfo.cardNumber && bankInfo.cardNumber !== '') {
            this.bankCardText.string = bankInfo.cardNumber;
        }
    },

    updateEditText () {
        let outProgress = this.outSlider.progress;
        this.outNumEdit.string = Math.floor(outProgress * Global.Player.getPy('gold'));
    },

    updateProgress () {
        let outNum = this.outNumEdit.string;
        if (outNum === '') {
            this.outSlider.progress = 0;
            this.outProgress.progress = 0;
            return;
        }

        outNum = parseInt(outNum);
        this.outSlider.progress = outNum / parseInt(Global.Player.getPy('gold'));
        this.outProgress.progress = outNum / parseInt(Global.Player.getPy('gold'));
    },

    start () {
        this.outProgress.progress = 0;
        this.outTip.string = '提现3-5分钟到账，提现前确认绑定的支付宝账号准确无误，提现收取提现金额{0}%的手续费'.format(Global.Data.getData('withdrawCashBillPercentage'));
        this.updatePlayerInfoUI();
        this.showBindGroup('ali');
        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
    },

    onDestroy () {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    },

    messageCallbackHandler: function(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.updatePlayerInfoUI();
                break;
        }
    },

    editEnd: function (event) {
        let outNum = this.outNumEdit.string;
        if (outNum === '') {
        } else {
            outNum = parseInt(outNum);
            if (outNum > Global.Player.getPy('gold')) {
                this.outNumEdit.string = Global.Player.getPy('gold');
            }
        }
        this.updateProgress();
    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
            case 'bindZFB':
                Global.DialogManager.createDialog('Bank/BindDialog', {showType: 'zfb'});
                break;
            case 'bindWX':
                Global.DialogManager.createDialog('Bank/BindDialog', {showType: 'wx'});
                break;
            case 'bindBankCard':
                Global.DialogManager.createDialog('Bank/BindDialog', {showType: 'bankCard'});
                break;
            case 'clear':
                this.outNumEdit.string = '';
                this.outSlider.progress = 0;
                this.outProgress.progress = 0;
                break;
            case 'max':
                this.outSlider.progress = 1;
                this.outProgress.progress = 1;
                this.updateEditText();
                break;
            case 'slider':
                this.outProgress.progress = event.progress;
                this.updateEditText();
                break;
            case 'record':
                Global.DialogManager.createDialog('Bank/TiXianRecordDialog');
                break;
            case 'ali':
            case 'wx':
            case 'bankCard':
                this.showBindGroup(param);
                break;
            case 'exchange':
                let outNum = this.outNumEdit.string;
                if (outNum === '') {
                    Global.DialogManager.addTipDialog('请输入！');
                    return;
                }

                outNum = parseInt(outNum);
                if (outNum <= 0) {
                    Global.DialogManager.addTipDialog('请输入0以上的数字！');
                    return;
                }

                if (outNum > Global.Player.getPy('gold')) {
                    Global.DialogManager.addTipDialog('金额不足！');
                    return;
                }

                let tixianType = Global.Enum.withdrawCashType.ALI_PAY;
                if (this.bankCardGroup.active) {
                    tixianType = Global.Enum.withdrawCashType.BANK_CARD;
                }

                if (tixianType === Global.Enum.withdrawCashType.ALI_PAY) {
                    let aliInfo = JSON.parse(Global.Player.getPy('aliPayInfo') || "{}");
                    if (!!aliInfo && !!aliInfo.aliPayAccount && aliInfo.aliPayAccount !== '') {
                    } else {
                        Global.DialogManager.addTipDialog('未绑定支付宝账号，请先绑定！');
                        return;
                    }
                } else if (tixianType === Global.Enum.withdrawCashType.BANK_CARD) {
                    let bankInfo = JSON.parse(Global.Player.getPy('bankCardInfo')|| "{}");
                    if (!!bankInfo && !!bankInfo.cardNumber && bankInfo.cardNumber !== '') {
                    } else {
                        Global.DialogManager.addTipDialog('未绑定银行卡，请先绑定！');
                        return;
                    }
                }
                Global.DialogManager.addLoadingCircle();
                Global.API.hall.withdrawCashRequest(outNum, tixianType, function (msg) {
                    Global.DialogManager.removeLoadingCircle();
                    Global.DialogManager.addPopDialog('提款申请成功！请耐心等待！');
                });
                break;
        }
    }

    // update (dt) {},
});
