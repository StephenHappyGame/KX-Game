let utils = require('../../Shared/utils');
let CHANGE_GOLD_SHOW_TIME = 3;

cc.Class({
    extends: cc.Component,

    properties: {
        cannonAnimationCtrl: require("SpriteFrameAnimationWidgetCtrl"),
        powerLabel: cc.Label,
        changePowerNode: cc.Node,

        cannonBaseNode: cc.Node,

        userInfoNode: cc.Node,
        avatarSprite: cc.Sprite,
        goldCountLabel: cc.Label,
        nicknameLabel: cc.Label,
        winScoreLabel: cc.Label,

        lockLineWidgetCtrl: require("LockLineWidgetCtrl")
    },

    start () {
        this.isDestroyed = false;
        this.powerIndex = this.powerIndex || 1;
        this.lockFishCtrl = this.lockFishCtrl || null;
    },

    onDestroy(){
        this.isDestroyed = true;
    },

    initWidget(roomUserInfo, isSelf, posIndex, winGold, changeCannonPowerCallback){
        this.roomUserInfo = roomUserInfo;
        this.changePowerNode.active = isSelf;
        this.posIndex = posIndex;
        // 提示玩家自己的位置

        this.winGold = winGold;

        // 更新用户信息
        this.updateUserInfo(roomUserInfo.userInfo, this.winGold);

        // 修改用户信息的位置
        if(posIndex === 1){
            this.userInfoNode.x *= -1;
        }else if (posIndex === 2){
            this.userInfoNode.x *= -1;
            this.userInfoNode.y *= -1;

            this.cannonBaseNode.rotation = 180;

            this.powerLabel.node.rotation = 180;
        }else if (posIndex === 3){
            this.userInfoNode.y *= -1;

            this.cannonBaseNode.rotation = 180;

            this.powerLabel.node.rotation = 180;
        }

        this.changeCannonPowerCallback = changeCannonPowerCallback;

        this.cannonAnimationCtrl.initAnimation();
    },

    updateUserInfo(userInfo, winGold){
        if (this.isDestroyed) return;
        this.roomUserInfo.userInfo = userInfo;
        this.winGold = winGold;
        Global.CCHelper.updateSpriteFrame(userInfo.avatar, this.avatarSprite);
        this.goldCountLabel.string = parseFloat((userInfo.gold + winGold).toFixed(2)) + '';
        this.nicknameLabel.string = Global.Player.convertNickname(userInfo.nickname);
    },

    goldChange(changeCount, showAnim){
        if (this.isDestroyed) return;
        if (changeCount === 0) return;
        this.winGold += changeCount;
        let curCount = this.roomUserInfo.userInfo.gold + this.winGold;
        this.goldCountLabel.string = parseFloat(curCount.toFixed(2)) + '';
        if ((changeCount > 0) && showAnim){
            this.showGoldChange(changeCount);
        }
    },

    showGoldChange(changeCount){
        if (changeCount === 0) return;
        this.winScoreLabel.string = "+" + parseFloat(changeCount.toFixed(2)) + '';
        this.winScoreLabel.node.y = 20;
        this.winScoreLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.p(0, 40)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
    },

    onFire(rotation){
        if (this.isDestroyed) return;
        this.cannonAnimationCtrl.node.rotation = rotation * -1 + 90;
        this.cannonAnimationCtrl.node.rotation -= this.cannonBaseNode.rotation;
        // 播放动画
        this.cannonAnimationCtrl.startAnimation(false);
        // 锁定时更新锁定路径
        if (!!this.lockFishCtrl && !!this.lockFishCtrl.node){
            this.lockLineWidgetCtrl.updateLine(this.lockFishCtrl.node.parent.convertToWorldSpaceAR(this.lockFishCtrl.node.position));
        }
    },

    getCannonWorldPos: function () {
        if (this.isDestroyed) return cc.p(0,0);
        return this.cannonBaseNode.convertToWorldSpaceAR(this.cannonAnimationCtrl.node.position);
    },

    getUserHeadWorldPos : function () {
        if (this.isDestroyed) return cc.p(0,0);
        return this.avatarSprite.node.parent.convertToWorldSpaceAR(this.avatarSprite.node.position);
    },

    getCurGold: function () {
        return this.roomUserInfo.userInfo.gold + this.winGold;
    },

    onLeave: function () {
        if (this.isDestroyed) return;
        this.cannonAnimationCtrl.stopAnimation();
        this.node.destroy();
    },

    onChangeCannonPower: function (bulletGold, powerIndex) {
        if (this.isDestroyed) return;
        this.powerIndex = powerIndex;
        this.powerLabel.string = parseFloat(bulletGold.toFixed(2)).toString();
    },

    onLockFish: function (fishCtrl) {
        if(!fishCtrl || !fishCtrl.node){
            this.lockFishCtrl = null;
            this.lockLineWidgetCtrl.node.active = false;
        }else{
            this.lockFishCtrl = fishCtrl;
            this.lockLineWidgetCtrl.node.active = true;
        }
    },

    onBtnClick: function (event, params) {
        if (params === "addPower"){
            if (this.powerIndex === 10) return;
            this.powerIndex++;
            this.changeCannonPowerCallback(this.powerIndex);
        }else if(params === "downPower"){
            if (this.powerIndex === 1) return;
            this.powerIndex--;
            this.changeCannonPowerCallback(this.powerIndex);
        }
    },

    onClear: function () {
        this.isDestroyed = true;

        this.lockFishCtrl = null;

        this.cannonAnimationCtrl.stopAnimation();

        this.node.destroy();
    },

    update () {
        if (!!this.lockFishCtrl && !!this.lockFishCtrl.node){
            this.lockLineWidgetCtrl.updateLine(this.lockFishCtrl.node.parent.convertToWorldSpaceAR(this.lockFishCtrl.node.position));
        }
    },
});
