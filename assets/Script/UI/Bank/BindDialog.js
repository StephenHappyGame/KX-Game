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
        titleImg: cc.Sprite,
        accountLabelImg: cc.Sprite,
        tip: cc.Label,
        accountEdit: cc.EditBox,
        nameEdit: cc.EditBox
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.showType = this.dialogParameters.showType;
        if (this.showType === 'wx') {
            this.node.active = false;
            Global.CCHelper.updateSpriteFrame('Bank/labelImg_bindWX', this.titleImg);
            Global.CCHelper.updateSpriteFrame('Bank/labelImg_wxAccount', this.accountLabelImg, function () {
                this.node.active = true;
            }.bind(this));
            this.tip.string = '请输入正确的微信账号以及微信实名制姓名，否则会导致兑换失败哦~';
        } else if (this.showType === 'bankCard') {
            this.node.active = false;
            Global.CCHelper.updateSpriteFrame('Bank/labelImg_bindBankCard', this.titleImg);
            Global.CCHelper.updateSpriteFrame('Bank/labelImg_bankCardAccount', this.accountLabelImg, function () {
                this.node.active = true;
            }.bind(this));
            this.tip.string = '请输入正确的银行卡账号以及真实名姓名，否则会导致兑换失败哦~';
        }
    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
            case 'bind':
                cc.log(this.showType);
                let account = this.accountEdit.string;
                let name = this.nameEdit.string;

                if (account === '') {
                    Global.DialogManager.addTipDialog('请输入账号！');
                    return;
                }

                if (name === '') {
                    Global.DialogManager.addTipDialog('请输入姓名！');
                    return;
                }

                if (name.indexOf(' ') !== -1) {
                    Global.DialogManager.addTipDialog('姓名格式错误！');
                    return;
                }

                if (this.showType === 'bankCard') {
                    Global.API.hall.updateBankCardInfoRequest(account, '未知', name, function () {
                        Global.DialogManager.addTipDialog('绑定成功！');
                        Global.DialogManager.destroyDialog(this);
                    }.bind(this));
                } else if (this.showType === 'zfb') {
                    Global.API.hall.updateAliPayInfoRequest(account, name, function () {
                        Global.DialogManager.addTipDialog('绑定成功！');
                        Global.DialogManager.destroyDialog(this);
                    }.bind(this));
                }
                break;
        }
    }

    // update (dt) {},
});
