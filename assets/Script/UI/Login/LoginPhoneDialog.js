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
        phoneEdit: cc.EditBox,
        pwdEdit: cc.EditBox
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'register':
                Global.DialogManager.createDialog('Login/RegisterDialog');
                break;
            case 'login':
                let account = this.phoneEdit.string;
                let pwd = this.pwdEdit.string;

                if (account === '') {
                    Global.DialogManager.addTipDialog('请输入手机号！');
                    return;
                }

                if (account.length < 11) {
                    Global.DialogManager.addTipDialog('请输入正确的手机号！');
                    return;
                }

                if (pwd === '') {
                    Global.DialogManager.addTipDialog('请输入密码！');
                    return;
                }

                let accountData = {
                    account: account,
                    password: pwd,
                    loginPlatform: Global.Enum.loginPlatform.ACCOUNT
                };

                if (!!this.dialogParameters && !!this.dialogParameters.loginCb) {
                    this.dialogParameters.loginCb(accountData);
                }
                break;
            case 'reset':
                Global.DialogManager.createDialog('Login/ResetPwdDialog');
                break;
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
        }
    }

    // update (dt) {},
});
