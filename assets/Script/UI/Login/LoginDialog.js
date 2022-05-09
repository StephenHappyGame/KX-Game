cc.Class({
    extends: cc.Component,

    properties: {
        loadingGroup: cc.ProgressBar,
        progressText: cc.Label,

        accountEdit: cc.EditBox,
        passwordEdit: cc.EditBox,

        loginGroup: cc.Node,
        btnGroup: cc.Node,

        logo: cc.Node
    },

    onLoad: function () {
        this.logo.active = false;
        this.btnGroup.active = false;
        this.loginGroup.active = false;

        this.isLoadingFinished = false;

        //加载资源
        this.loading();
    },

    onDestroy: function () {
    },

    loading: function () {
        let loadDirArr = [
            "Bank",
            "Commission",
            "Common",
            "CommonJPG",
            "Font",
            "GameCommon",
            "Hall",
            "Loading",
            "Login",
            "Notice",
            "Pop",
            "Rank",
            "Recharge",
            "Setting",
            "Sound",
            "Update",
            "UserInfo"
        ];
        let allTotalCount = 0;
        let allCompletedCount = 0;
        let finishedCount = 0;
        this.loadingGroup.progress = 0;
        let self = this;

        function loadDir(dir) {
            let lastTotalCount = 0;
            let lastCompletedCount = 0;
            cc.loader.loadResDir(dir, cc.Prefab,
                function (completedCount , totalCount ){
                    if ((finishedCount === loadDirArr.length) && (self.loadingGroup.progress === 1))  return;
                    if (self.isLoadingFinished) return;
                    if (lastTotalCount === 0) {
                        allTotalCount += totalCount;
                        allCompletedCount += completedCount;
                    }else{
                        allTotalCount += (totalCount - lastTotalCount);
                        allCompletedCount += (completedCount - lastCompletedCount);
                    }
                    lastTotalCount = totalCount;
                    lastCompletedCount = completedCount;
                    if (totalCount === completedCount){
                        finishedCount++;
                    }
                    let newProgress = 0;
                    if (allTotalCount === 0){
                        newProgress = finishedCount / loadDirArr.length;
                    }else{
                        newProgress = allCompletedCount / allTotalCount;
                    }
                    if (newProgress > self.loadingGroup.progress){
                        self.progressText.string = (newProgress * 100).toFixed(0) + '%';
                        self.loadingGroup.progress = newProgress;
                    }

                    if (newProgress >= 1){
                        self.loadingFinished();
                    }
                },
                function (err) {
                    if (!!err) {
                        cc.log(err);
                    }
                });
        }
        for (let i = 0; i < loadDirArr.length; ++i){
            loadDir(loadDirArr[i]);
        }
    },

    loadingFinished: function () {
        if (this.isLoadingFinished) return;
        this.isLoadingFinished = true;
        this.loadingGroup.progress = 1;
        this.progressText.string = Math.floor(this.loadingGroup.progress.toFixed(2) * 100) + '%';
        this.loadingGroup.node.active = false;

        //logo动画
        this.logo.active = true;
        this.logo.scale = 0.1;
        this.logo.runAction(cc.scaleTo(0.5, 1).easing(cc.easeBackOut()));

        let autoLogin = cc.sys.isMobile;

        if (!!this.dialogParameters && this.dialogParameters.logoutEvent) {
            autoLogin = false;
        }

        let account = cc.sys.localStorage.getItem('account');
        if (autoLogin && !!account && account.length > 0) {
            let accountData = {
                account: account,
                password: cc.sys.localStorage.getItem('password'),
                loginPlatform: parseInt(cc.sys.localStorage.getItem('platform'))
            };
            this.login(accountData);
        }else{
            this.btnGroup.active = true;
            this.loginGroup.active = Global.Constant.test;
        }
    },
    
    onBtnClk: function (event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'register':{
                let data = {
                    account : this.accountEdit.string,
                    password : this.passwordEdit.string,
                    loginPlatform : Global.Enum.loginPlatform.ACCOUNT
                };
                this.registerAP(data);
                break;
            }
            case 'login':{
                let data = {
                    account : this.accountEdit.string,
                    password : this.passwordEdit.string,
                    loginPlatform : Global.Enum.loginPlatform.ACCOUNT
                };
                this.login(data);
                break;
            }
            case 'wechatLogin':
                break;
            case 'phoneLogin':
                //this.visitorLogin();
                Global.DialogManager.createDialog('Login/LoginPhoneDialog', {loginCb: function (data) {
                    this.login(data);
                }.bind(this)});
                break;
            case 'visitorLogin':
                this.visitorLogin();
                break;
        }
    },

    enterGame: function () {
        Global.DialogManager.createDialog('Hall/HallDialog', null, function () {
            Global.DialogManager.removeLoadingCircle();
            Global.DialogManager.destroyDialog(this);
            if (Global.DialogManager.isDialogExit("Login/RegisterDialog")) Global.DialogManager.destroyDialog("Login/RegisterDialog");
            if (Global.DialogManager.isDialogExit("Login/LoginPhoneDialog")) Global.DialogManager.destroyDialog("Login/LoginPhoneDialog");
        }.bind(this));
    },

    //游客登录
    visitorLogin: function () {
        let account = cc.sys.localStorage.getItem('account');
        let password = cc.sys.localStorage.getItem('password');
        let platform = parseInt(cc.sys.localStorage.getItem('platform') || "");
        if (!!account && !!password && !!platform){
            this.login({account: account, password: password, loginPlatform: platform});
        }else{
            account = Date.now().toString();
            password = Date.now().toString();
            platform = Global.Enum.loginPlatform.ACCOUNT;
            this.registerAP({account: account, password: password, loginPlatform: platform, smsCode: ""});
        }
    },

    //注册账号
    registerAP: function (data) {
        if (!data.account || !data.password || !data.loginPlatform){
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
    },

    //登录
    login: function (data) {
        if (!data.account || !data.password || !data.loginPlatform){
            Global.DialogManager.addTipDialog("请输入有效帐号密码");
            return;
        }
        Global.DialogManager.addLoadingCircle();
        Global.NetworkLogic.login(data, function () {
            Global.DialogManager.removeLoadingCircle();
            this.saveAccount(data.account, data.password, data.loginPlatform);
            this.enterGame();
        }.bind(this),
            function () {
                Global.DialogManager.removeLoadingCircle();
                Global.DialogManager.addPopDialog("登录失败，请重试");
                this.saveAccount("", "", "");
            }.bind(this));
    },

    //本地帐号存储
    saveAccount: function (account, password, platform) {
        cc.sys.localStorage.setItem('account', account);
        cc.sys.localStorage.setItem('password', password);
        cc.sys.localStorage.setItem('platform', platform.toString());
    }
});
