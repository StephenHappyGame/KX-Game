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
        accountEdit: cc.EditBox,
        codeEdit: cc.EditBox,
        pwdEdit: cc.EditBox,
        confirmPwdEdit: cc.EditBox,

        getCodeBtn: cc.Button,
        countDown: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    onDestroy () {
        if (!!this.countDownInterval) {
            clearInterval(this.countDownInterval);
            this.countDownInterval = null;
        }
    },

    onBtnClk: function (event, param) {

        let account = this.accountEdit.string;
        let code = this.codeEdit.string;
        let pwd = this.pwdEdit.string;
        let confirmPwd = this.confirmPwdEdit.string;

        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
            case 'getCode':
                if (account === '') {
                    Global.DialogManager.addTipDialog('请输入手机号！');
                    return;
                }

                if (account.length < 11) {
                    Global.DialogManager.addTipDialog('请输入正确的手机号！');
                    return;
                }

                Global.API.http.getPhoneCode(account);
                let time = 60;
                this.getCodeBtn.node.active = false;
                this.countDown.string = '60s';
                this.countDownInterval = setInterval(function () {
                    time--;
                    if (time < 0) {
                        clearInterval(this.countDownInterval);
                        this.countDownInterval = null;
                        this.getCodeBtn.node.active = true;
                    }
                    this.countDown.string = time + 's';
                }.bind(this), 1000);
                break;
            case 'confirm':
                if (account === '') {
                    Global.DialogManager.addTipDialog('请输入手机号！');
                    return;
                }

                if (account.length < 11) {
                    Global.DialogManager.addTipDialog('请输入正确的手机号！');
                    return;
                }

                if (code === '') {
                    Global.DialogManager.addTipDialog('请输入手机验证码！');
                    return;
                }

                if (pwd === '' || confirmPwd === '') {
                    Global.DialogManager.addTipDialog('请输入密码！');
                    return;
                }

                if (pwd !== confirmPwd) {
                    Global.DialogManager.addTipDialog('两次输入的密码不一致！');
                    return;
                }

                Global.API.http.resetPasswordByPhoneRequest(account, pwd, code, {}, function (msg) {
                    if (msg.code === Global.Code.OK) {
                        Global.DialogManager.destroyDialog(this);
                        Global.DialogManager.addTipDialog('密码重置成功！');
                    }
                }.bind(this));
                break;
        }
    }

    // update (dt) {},
});
