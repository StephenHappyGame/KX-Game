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
        wxBg: cc.Node,
        aliBg: cc.Node,
        qqBg: cc.Node,
        unionBg: cc.Node,
        alipayBtnNode: cc.Node,
        wxBtnNode: cc.Node,
        qqBtnNode: cc.Node,
        unionBtnNode: cc.Node,
        rechargeNum: [cc.Label],
        rechargeNumEdit: cc.EditBox
    },

    showBg (rechargeType) {
        this.rechargeType = rechargeType;

        this.wxBg.active = rechargeType === 'wx';
        this.aliBg.active = rechargeType === 'alipay';
        this.qqBg.active = rechargeType === "qq";
        this.unionBg.active = rechargeType === "union";

        let rechargeConfig = this.rechargeConfig[rechargeType];
        if (!rechargeConfig) return;
        this.rechargeNumDefine = rechargeConfig.list;
        for (let i = 0; i < 8; i ++) {
            if (!!this.rechargeNumDefine[i]) {
                this.rechargeNum[i].string = this.rechargeNumDefine[i] + '元';
                this.rechargeNum[i].node.parent.active = true;
            } else {
                this.rechargeNum[i].node.parent.active = false;
            }
        }
    },

    start () {
        let startRechargeType;
        this.rechargeNumDefine = null;
        let rechargeConfig = JSON.parse(Global.Data.getData('rechargeConfig'));
        for (let key in rechargeConfig){
            if (rechargeConfig.hasOwnProperty(key)){
                let data = rechargeConfig[key];
                if (!!data.enable){
                    if (!startRechargeType || !this.rechargeNumDefine){
                        startRechargeType = key;
                        this.rechargeNumDefine = data.list;
                    }
                }else{
                    this[key + "BtnNode"].active = false;
                }
            }
        }
        this.rechargeConfig = rechargeConfig;
        this.showBg(startRechargeType);

        for (let i = 0; i < 8; i ++) {
            if (!!this.rechargeNumDefine[i]) {
                this.rechargeNum[i].string = this.rechargeNumDefine[i] + '元';
            } else {
                this.rechargeNum[i].node.parent.active = false;
            }
        }
    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
            case 'wx':
            case 'qq':
            case 'union':
            case 'alipay':
                this.showBg(param);
                break;
            case 'rechargeNow':
                let num = this.rechargeNumEdit.string;
                if (num === '') {
                    Global.DialogManager.addTipDialog('请输入充值金额！');
                    return;
                }
                let minNum = parseInt(Global.Data.getData("minRechargeCount"));
                num = parseInt(num);
                if (num < minNum) {
                    Global.DialogManager.addPopDialog('单笔充值不得低于' + minNum );
                    return;
                }

                let rechargeInfo = {
                    count: num
                };
                rechargeInfo.payType = Global.Enum.PAY_TYPE.ALI_PAY;
                if (this.rechargeType === 'wx') {
                    rechargeInfo.payType = Global.Enum.PAY_TYPE.WE_CHAT;
                } else if (this.rechargeType === 'qq'){
                    rechargeInfo.payType = Global.Enum.PAY_TYPE.QQ_PAY;
                } else if (this.rechargeType === 'union'){
                    rechargeInfo.payType = Global.Enum.PAY_TYPE.UNION_PAY;
                }

                Global.API.hall.purchaseRechargeItemRequest(null, Global.Enum.RechargePlatform.ANXEN_PAY, rechargeInfo, function (data) {
                    if(!!data.msg.url){
                        cc.sys.openURL(data.msg.url);
                    }
                });
                break;
            case 'clear':
                this.rechargeNumEdit.string = '';
                break;
            case 'recharge_0':
            case 'recharge_1':
            case 'recharge_2':
            case 'recharge_3':
            case 'recharge_4':
            case 'recharge_5':
            case 'recharge_6':
            case 'recharge_7':
                let level = parseInt(param.split('_')[1]);
                this.rechargeNumEdit.string = this.rechargeNumDefine[level];
                this.rechargeLevel = level;
                break;
        }
    }

    // update (dt) {},
});
