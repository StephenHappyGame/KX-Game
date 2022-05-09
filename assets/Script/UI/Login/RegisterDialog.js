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

        reAccountEdit: cc.EditBox,
        reCodeEdit: cc.EditBox,
        rePwdEdit: cc.EditBox,
        reConfirmPwdEdit: cc.EditBox,

        countDown: cc.Label,
        getCodeBtn: cc.Button
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

        let account = this.reAccountEdit.string;
        //let code = this.reCodeEdit.string;
        let pwd = this.rePwdEdit.string;
        let confirmPwd = this.reConfirmPwdEdit.string;

        switch (param) {
            case 'register':
                if (account === '') {
                    Global.DialogManager.addTipDialog('请输入手机号！');
                    return;
                }

                if (account.length < 11) {
                    Global.DialogManager.addTipDialog('请输入正确的手机号！');
                    return;
                }

                /*if (code === '') {
                    Global.DialogManager.addTipDialog('请输入手机验证码！');
                    return;
                }*/

                if (pwd === '' || confirmPwd === '') {
                    Global.DialogManager.addTipDialog('请输入密码！');
                    return;
                }

                if (pwd !== confirmPwd) {
                    Global.DialogManager.addTipDialog('两次输入的密码不一致！');
                    return;
                }

                let data = {account: account, password: pwd, loginPlatform: Global.Enum.loginPlatform.ACCOUNT, smsCode: "1111"};
                //注册账号
                if (!account || !pwd){
                    Global.DialogManager.addTipDialog("请输入有效帐号密码");
                    return;
                }
                Global.DialogManager.addLoadingCircle();
                Global.NetworkLogic.register(data, {avatar: "Common/head_icon_default"},
                    function () {
                        Global.DialogManager.removeLoadingCircle();
                        // 注册成功
                        this.saveAccount(data.account, data.password, data.loginPlatform);
                        this.enterGame();
                    }.bind(this));
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
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
        }
    },

    enterGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.removeLoadingCircle();
            Global.DialogManager.destroyDialog(this);
            Global.DialogManager.destroyDialog("Login/LoginDialog");
        }.bind(this));
    },

    //本地帐号存储
    saveAccount: function (account, password, platform) {
        cc.sys.localStorage.setItem('account', account);
        cc.sys.localStorage.setItem('password', password);
        cc.sys.localStorage.setItem('platform', platform.toString());
    }
});
