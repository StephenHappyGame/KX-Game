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

        this.weekTotalAchievementText.string = (info.directlyMemberAchievement + info.agentMemberAchievement).toFixed(2);//本周总业绩
        this.directlyMemberAchievementText.string = info.directlyMemberAchievement.toFixed(2);//直属会员业绩
        this.agentMemberAchievementText.string = info.agentMemberAchievement.toFixed(2);//代理会员业绩
        //本周我的佣金客户端根据比例计算
        let num = info.directlyMemberAchievement + info.agentMemberAchievement;
        let profit = Global.AgentProfit.getProportionByNum(num);
        this.thisWeekLowerAgentCommisionText.string = (num * profit.proportion).toFixed(2);//本周我的佣金
        this.currentLevelTip.string = '当前每万元返{0}元\n您产生的业绩量达到{1}即每万元返{2}元'.format(profit.proportion * 10000, profit.min, profit.proportion * 10000);
        if (num < profit.min) {
            this.currentLevelTip.string = '当前每万元返{0}元\n您产生的业绩量达到{1}即每万元返{2}元'.format(0, profit.min, profit.proportion * 10000);
        }
        this.realCommisionText.string = info.realCommision.toFixed(2);//可提现的佣金
        this.totalCommisionText.string = info.totalCommision.toFixed(2);//总佣金
        this.lowerAgentCommisionText.string = info.lowerAgentCommision.toFixed(2);//下线代理佣金

        this.directlyMemberCountText.string = info.directlyMemberCount;//我的直属会员
        this.weekAddedDirectlyMemberCountText.string = info.weekAddedDirectlyMemberCount;//本周新增
        this.monthAddedDirectlyMemberCountText.string = info.monthAddedDirectlyMemberCount;//本月新增

        this.agentMemberCountText.string = info.agentMemberCount;//我的代理
        this.weekAddedAgentMemberCountText.string = info.weekAddedAgentMemberCount;//本周新增
        this.monthAddedAgentMemberCountText.string = info.monthAddedAgentMemberCount;//本月新增
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
            cc.log('已加载所有会员数据');
            return;
        }

        cc.log('更新会员数据');
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
            cc.log('已加载所有代理数据');
            return;
        }

        cc.log('更新代理数据');
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
                    Global.DialogManager.addTipDialog('可提现佣金不足！');
                    return;
                }

                Global.API.hall.extractionCommissionRequest(function (msg) {
                    Global.DialogManager.addPopDialog('提取成功！');
                });
                break;
            case 'tixianDetail':
                Global.DialogManager.createDialog('Commission/TiXianDetailDialog');
                break;
        }
    }

    // update (dt) {},
});
