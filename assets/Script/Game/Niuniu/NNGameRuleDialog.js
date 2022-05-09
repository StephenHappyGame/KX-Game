cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        ruleItem: cc.Prefab,
        titleImg: cc.Sprite
    },

    createContent: function () {
        var rule = [
            {typ: 'title', text: '人数'},
            {typ: 'des', text: '最多6人'},
            {typ: 'title', text: '牌数'},
            {typ: 'des', text: '一副牌除去大小王52张，每位玩家每次5张牌'},
            {typ: 'title', text: '流程'},
            {typ: 'des', text: '每位玩家发5张牌，其中4张只有自己能看到，此时开始根据4张明牌开始进行抢庄，最大倍率优先坐庄，确定完庄家后闲家押注，最后根据牌型同庄家进行比较，不同牌型倍率不同，庄家不够赔付时优先赔付牌型较大的玩家'},
            {typ: 'title', text: '牌型'},
            {typ: 'des', text: '没牛：任意3张牌不能组成10的倍数\n' +
                                '牛一：任意3张牌为10的倍数,剩余2张牌除10余1\n' +
                                '牛二：任意3张牌为10的倍数,剩余2张牌除10余2\n' +
                                '牛三：任意3张牌为10的倍数,剩余2张牌除10余2\n' +
								'......\n' +
                                '牛九：任意3张牌为10的倍数,剩余2张牌除10余9\n' +
                                '牛牛：任意3张牌为10的倍数,剩余2张牌除10余0\n' +
                                '无花牛：所有牌不小于10\n' +
                                '炸弹牛：有四张同样大小的牌\n' +
                                '五小牛：每张牌小于5,加起来不大于10\n'}, 
            {typ: 'title', text: '牌型大小'},
            {typ: 'des', text: '五小牛-炸弹牛-无花牛-牛牛-牛九-牛八-牛七-牛六-牛五-牛四-牛三-牛二-牛一-没牛\n' +
                                '牌型相同时侧由大到小比点数，如单牌双方先比较最大的单牌，相同则比第二张，若所有点数都相同则比花色'},
            {typ: 'title', text: '花色大小'},
            {typ: 'des', text: '黑桃-红桃-梅花-方块'},
            {typ: 'title', text: '点数大小'},
            {typ: 'des', text: 'K-Q-J-10-9-8-7-6-5-4-3-2-A'},
            {typ: 'title', text: '积分算法'},
            {typ: 'des', text: '五小牛8倍, 炸弹牛6倍, 无花牛5倍 \n' +
								'牛牛4倍, 牛九3倍, 牛八牛七2倍, 其余1倍'}
        ];

        for (var i = 0; i < rule.length; i ++) {
            var item = cc.instantiate(this.ruleItem);
            item.parent = this.content;
            item.getComponent('NNGameRuleItem').updateUI(rule[i]);
        }
    },
    
    createScoreContent: function () {
        Global.CCHelper.updateSpriteFrame('Hall/labelImg_scoreIntroduction', this.titleImg);
        var rule = [
            {typ: 'title', text: '积分获取途径'},
            {typ: 'des', text: Global.Data.getData('couponObtainWayText')},
            {typ: 'title', text: '积分使用方法'},
            {typ: 'des', text: Global.Data.getData('couponObtainUseWayText')}
        ];

        for (var i = 0; i < rule.length; i ++) {
            var item = cc.instantiate(this.ruleItem);
            item.parent = this.content;
            item.getComponent('GameRuleItem').updateUI(rule[i]);
        }
    },

    // use this for initialization
    onLoad: function () {
        if (!!this.dialogParameters) {
            var typ = this.dialogParameters.typ;
            if (!!typ && typ === 'score') {
                this.createScoreContent();
                return;
            }
        }

        this.createContent();
    },

    onBtnClk: function (event, param) {
        switch (param) {
            case 'close':
                Global.DialogManager.destroyDialog(this);
                break;
        }

    },
});
