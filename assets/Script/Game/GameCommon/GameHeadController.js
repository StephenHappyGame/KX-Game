// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

let CHANGE_GOLD_SHOW_TIME = 3;

cc.Class({
    extends: cc.Component,

    properties: {
        goldLabel: cc.Label,
        nicknameLabel: cc.Label,
        headSprite: cc.Sprite,
        betActionDir: 0,
        winGoldLabel: cc.Label,
        loseGoldLabel: cc.Label
    },


    start () {
        if (!this.userInfo){
            this.userInfo = {
                uid: this.uid,
                gold: 110,
                nickname: "",
                avatar: ""
            };
        }
    },

    updateInfo(userInfo){
        if (!userInfo){
            this.userInfo = {
                uid: 0,
                gold: 0,
                nickname: "",
                avatar: ""
            };
            this.node.parent.active = false;
        }else{
            this.node.parent.active = true;
            this.userInfo = Global.Utils.clone(userInfo);
            if(!!this.goldLabel) this.goldLabel.string =  userInfo.gold.toFixed(2);
            this.nicknameLabel.string = Global.Player.convertNickname(userInfo.nickname);
            Global.CCHelper.updateSpriteFrame(userInfo.avatar, this.headSprite);
        }
    },

    goldChange(changeCount, showAnim){
        if (changeCount === 0) return;
        this.userInfo.gold += changeCount;
        if(!!this.goldLabel) this.goldLabel.string =  this.userInfo.gold.toFixed(2);
        if (!showAnim) return;
        let label = parseFloat(changeCount.toFixed(2)) + "元";
        if(changeCount > 0){
            label = "+" + label;
            this.winGoldLabel.string = label;
            this.winGoldLabel.node.y = 20;
            this.winGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 40)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
        }else{
            this.loseGoldLabel.string = label;
            this.loseGoldLabel.node.y = 20;
            this.loseGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 40)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
        }
    },

    execBet(isTween){
        if (this.betActionDir === 0 || !isTween) return;
        this.node.runAction(cc.sequence([cc.moveBy(0.1, cc.v2(this.betActionDir * 20, 0)),cc.moveBy(0.1, cc.v2(this.betActionDir * -20, 0))]))
    },

    getUserInfo(){
        return this.userInfo;
    },

    getUid(){
        return !!this.userInfo?this.userInfo.uid : "";
    },
    
    getHeadPos: function () {
        return this.node.parent.position;
    }
});
