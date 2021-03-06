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

        yejiGroup: cc.Node,
        huiyuanGroup: cc.Node,
        dailiGroup: cc.Node,
        HYDLItem: cc.Prefab,
        huiyuanContent: cc.Node,
        dailiContent: cc.Node,

        weekTotalAchievementText: cc.Label,

        directlyMemberAchievementText: cc.Label,
        agentMemberAchievementText: cc.Label,
        thisWeekLowerAgentCommisionText: cc.Label,
        realCommisionText: cc.Label,
        totalCommisionText: cc.Label,
        lowerAgentCommisionText: cc.Label,
        currentLevelTip: cc.Label,

        directlyMemberCountText: cc.Label,
        weekAddedDirectlyMemberCountText: cc.Label,
        monthAddedDirectlyMemberCountText: cc.Label,

        agentMemberCountText: cc.Label,
        weekAddedAgentMemberCountText: cc.Label,
        monthAddedAgentMemberCountText: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    updateInfo () {
        let info = Global.Player;

        this.weekTotalAchievementText.string = (info.directlyMemberAchievement + info.agentMemberAchievement).toFixed(2);//???????????????
        this.directlyMemberAchievementText.string = info.directlyMemberAchievement.toFixed(2);//??????????????????
        this.agentMemberAchievementText.string = info.agentMemberAchievement.toFixed(2);//??????????????????
        //?????????????????????????????????????????????
        let num = info.directlyMemberAchievement + info.agentMemberAchievement;
        let profit = Global.AgentProfit.getProportionByNum(num);
        this.thisWeekLowerAgentCommisionText.string = (num * profit.proportion).toFixed(2);//??????????????????
        this.currentLevelTip.string = '??????????????????{0}???\n???????????????????????????{1}???????????????{2}???'.format(profit.proportion * 10000, profit.min, profit.proportion * 10000);
        if (num < profit.min) {
            this.currentLevelTip.string = '??????????????????{0}???\n???????????????????????????{1}???????????????{2}???'.format(0, profit.min, profit.proportion * 10000);
        }
        this.realCommisionText.string = info.realCommision.toFixed(2);//??????????????????
        this.totalCommisionText.string = info.totalCommision.toFixed(2);//?????????
        this.lowerAgentCommisionText.string = info.lowerAgentCommision.toFixed(2);//??????????????????

        this.directlyMemberCountText.string = info.directlyMemberCount;//??????????????????
        this.weekAddedDirectlyMemberCountText.string = info.weekAddedDirectlyMemberCount;//????????????
        this.monthAddedDirectlyMemberCountText.string = info.monthAddedDirectlyMemberCount;//????????????

        this.agentMemberCountText.string = info.agentMemberCount;//????????????
        this.weekAddedAgentMemberCountText.string = info.weekAddedAgentMemberCount;//????????????
        this.monthAddedAgentMemberCountText.string = info.monthAddedAgentMemberCount;//????????????
    },

    showGroup (groupName) {
        this.yejiGroup.active = groupName === 'yeji';
        this.huiyuanGroup.active = groupName === 'huiyuan';
        this.dailiGroup.active = groupName === 'daili';
    },

    onScrollEvent: function (target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                if (this.huiyuanGroup.active) {
                    this.updateHuiYuanList();
                } else if (this.dailiGroup.active) {
                    this.updateDaiLiList();
                }
                break;
        }
    },

    updateHuiYuanList () {
        if (this.huiyuanMax) {
            cc.log('???????????????????????????');
            return;
        }

        cc.log('??????????????????');
        Global.DialogManager.addLoadingCircle();
        Global.API.hall.getDirectlyMemberRecordDataRequest(this.huiyuanIndex, this.perCount, function (msg) {
            let totalCount = msg.msg.totalCount;
            let data = msg.msg.recordArr;
            for (let i = 0; i < data.length; i ++) {
                let item = cc.instantiate(this.HYDLItem);
                item.parent = this.huiyuanContent;
                item.getComponent('HuiYuanItem').updateUI(data[i]);
            }
            this.huiyuanIndex += this.perCount;
            if (this.huiyuanIndex > totalCount) {
                this.huiyuanMax = true;
            }

            Global.DialogManager.removeLoadingCircle();
        }.bind(this));
    },

    updateDaiLiList () {
        if (this.dailiMax) {
            cc.log('???????????????????????????');
            return;
        }

        cc.log('??????????????????');
        Global.DialogManager.addLoadingCircle();
        Global.API.hall.getAgentMemberRecordDataRequest(this.dailiIndex, this.perCount, function (msg) {
            let totalCount = msg.msg.totalCount;
            let data = msg.msg.recordArr;
            for (let i = 0; i < data.length; i ++) {
                let item = cc.instantiate(this.HYDLItem);
                item.parent = this.huiyuanContent;
                item.getComponent('HuiYuanItem').updateUI(data[i]);
            }
            this.dailiIndex += this.perCount;
            if (this.dailiIndex > totalCount) {
                this.dailiMax = true;
            }

            Global.DialogManager.removeLoadingCircle();
        }.bind(this));
    },

    start () {
        this.updateInfo();
        this.showGroup('yeji');

        this.huiyuanMax = false;
        this.dailiMax = false;
        this.huiyuanIndex = 0;
        this.dailiIndex = 0;
        this.perCount = 10;
        this.updateHuiYuanList();
        this.updateDaiLiList();

        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
    },

    onDestroy () {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    },

    messageCallbackHandler: function(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.updateInfo();
                break;
        }
    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
            case 'yeji':
            case 'huiyuan':
            case 'daili':
                this.showGroup(param);
                break;
            case 'tixian':
                let info = Global.Player;
                if (info.realCommision <= 0) {
                    Global.DialogManager.addTipDialog('????????????????????????');
                    return;
                }

                Global.API.hall.extractionCommissionRequest(function (msg) {
                    Global.DialogManager.addPopDialog('???????????????');
                });
                break;
            case 'tixianDetail':
                Global.DialogManager.createDialog('Commission/TiXianDetailDialog');
                break;
        }
    }

    // update (dt) {},
});
