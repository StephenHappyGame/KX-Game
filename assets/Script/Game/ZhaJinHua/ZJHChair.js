let gameProto = require('./GameProtoZJH');

cc.Class({
    extends: cc.Component,

    properties: {
        avatarImg: cc.Sprite,
        nameLabel: cc.Label,
        goldNum: cc.Label,
        statusBg: cc.Sprite,
        statusLabel: cc.Label,
        firstXiaZhuUI: cc.Sprite,
        loseMask: cc.Sprite,
        winResultPrefab: cc.Prefab,
        cardGroup: cc.Node,
        readyGroup: cc.Node,

        lookCardFlag: cc.Node,
        giveUpFlag: cc.Node,

        statusGroup: cc.Node,

        stakeGoldGroup: cc.Node,
        stakeGoldNum: cc.Label,

        addGoldEff: cc.Label,
        minusGoldEff: cc.Label
    },

    onLoad: function () {
        this.lookCardFlag.active = false;
        this.giveUpFlag.active = false;

        this.firstXiaZhuFlag = false;
    },

    updateUI: function (userInfo, posIndex, profitPercentage, parentNode) {
        this.parentNode = parentNode || this.parentNode;
        this.userInfo = userInfo;
        this.profitPercentage = profitPercentage;
        this.posIndex = 0;

        // 设置信息
        Global.CCHelper.updateSpriteFrame(this.userInfo.avatar, this.avatarImg.node.getComponent(cc.Sprite));
        this.nameLabel.string = Global.Player.convertNickname(this.userInfo.nickname);
        this.goldNum.string = this.userInfo.gold.toFixed(2);
        this.stakeGoldNum.string = "0";

        let offsetX = 135;
        if (posIndex === 2 || posIndex === 1) {
            this.statusBg.node.scaleX = -1;
            this.statusBg.node.x = -100;
            this.statusLabel.node.x = -100;

            this.firstXiaZhuUI.node.x = -60;

            this.statusGroup.x = -offsetX;
            this.statusGroup.y = -120;

            this.stakeGoldGroup.x = -offsetX;
            this.stakeGoldGroup.y = 10;
        } else if (posIndex === 5) {
            this.statusGroup.x = offsetX;
            this.statusGroup.y = -120;

            this.stakeGoldGroup.x = offsetX;
            this.stakeGoldGroup.y = 10;
        } else if (posIndex === 0) {
            this.statusGroup.x = 180;
            this.statusGroup.y = -90;

            this.stakeGoldGroup.y = 60;
        } else if (posIndex === 3 || posIndex === 4) {
            this.statusGroup.x = offsetX;
            this.statusGroup.y = -120;

            this.stakeGoldGroup.x = offsetX;
            this.stakeGoldGroup.y = 10;
        }
    },

    clearWidget: function () {
        this.giveUpStatus = false;
        this.loseStatus = false;
        this.lookCardStatus = false;
        this.statusLabel.node.active = false;
        this.firstXiaZhuFlag = false;
        this.firstXiaZhuUI.node.active = false;
        this.statusBg.node.active = false;
        this.loseMask.node.active = false;
        this.cardGroup.active = false;

        this.lookCardFlag.active = false;
        this.giveUpFlag.active = false;

        if (!!this.winResultUI) {
            this.winResultUI.destroy();
            this.winResultUI = null;
        }

        this.hideReadyGroup();
        this.stakeGoldNum.string = 0;
    },

    showGoldChangeEff: function (changeGold) {
        let goldChangeEff = this.minusGoldEff;
        goldChangeEff.string = changeGold + '元';
        if (changeGold > 0) {
            goldChangeEff = this.addGoldEff;
            goldChangeEff.string = '+' + (changeGold * (100 - parseInt(this.profitPercentage)) / 100).toFixed(2) + '元';
        }
        if (changeGold === 0) return;

        goldChangeEff.node.active = true;
        if (changeGold > 0) {
            goldChangeEff.node.y = 70;
            goldChangeEff.node.runAction(cc.moveBy(0.5, 0, 20));
        } else {
            goldChangeEff.node.runAction(cc.moveBy(0.5, 0, 50));
        }
        this.scheduleOnce(function () {
            goldChangeEff.node.active = false;
            goldChangeEff.node.y = 0;
        }.bind(this), 3000);
    },

    showCardGroup: function (haveGoldFrame) {
        this.cardGroup.active = true;
        this.loseMask.node.active = false;
        if (!!haveGoldFrame) {
            this.cardGroup.getChildByName('frame').active = true;
        }
        this.hideOther();
    },

    onUserStake: function (stakeCount ,totalStakeCount) {
        this.userInfo.gold -= stakeCount;
        this.stakeGoldNum.string = Math.abs(totalStakeCount).toFixed(2);
        this.goldNum.string = this.userInfo.gold.toFixed(2);
    },

    updateUserInfo: function (userInfo) {
        this.userInfo = userInfo;

        Global.CCHelper.updateSpriteFrame(this.userInfo.avatar, this.avatarImg.node.getComponent(cc.Sprite));
        this.nameLabel.string = Global.Player.convertNickname(this.userInfo.nickname);
        this.goldNum.string = this.userInfo.gold.toFixed(2);
    },

    showReady: function () {
        this.readyGroup.getChildByName('readyLabel').active = true;
    },

    showStatus: function (userStatus) {
        if (userStatus === gameProto.LOOK_CARD && !this.giveUpStatus && !this.loseStatus) {
            this.lookCardStatus = true;

            this.lookCardFlag.active = true;
        } else if (userStatus === gameProto.GIVE_UP) {
            this.giveUpStatus = true;

            this.lookCardFlag.active = false;
            this.giveUpFlag.active = true;
        } else if (userStatus === gameProto.LOSE) {
            this.statusBg.node.active = true;
            this.statusLabel.node.active = true;

            this.loseStatus = true;
            Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/UIImg/pop_mask', this.statusBg);
            this.statusLabel.string = "输";
            this.statusLabel.node.color = cc.Color.WHITE;
        }
    },

    showFirstXiaZhu: function () {
        this.firstXiaZhuFlag = true;
        this.firstXiaZhuUI.node.active = true;
    },

    showResult: function (isWin, winnerCardType) {
        if (isWin) {
            this.winResultUI = cc.instantiate(this.winResultPrefab);
            this.winResultUI.parent = this.node;
            this.winResultUI.y = 100;

            if (winnerCardType === gameProto.CARD_TYPE_ZASE_235) {
                this.winResultUI.getComponent('ZJHResultUI').showWinType(gameProto.CARD_TYPE_DAN_ZHANG);
            } else {
                this.winResultUI.getComponent('ZJHResultUI').showWinType(winnerCardType);
            }
        } else {
            this.showStatus(gameProto.LOSE);
        }
    },

    showLoseEff: function () {
        this.node.getComponent(cc.Animation).play('loseEff');
        this.scheduleOnce(function () {
            this.loseMask.node.active = true;
            this.loseMask.node.opacity = 0;

            this.loseMask.node.runAction(cc.fadeTo(0.3, 200));
        }, 1);
    },

    hideOther: function () {
        this.statusBg.node.active = false;
        this.statusLabel.node.active = false;
        this.firstXiaZhuUI.node.active = false;
    },

    showOther: function () {
        if (this.loseStatus) {
            this.statusBg.node.active = true;
            this.statusLabel.node.active = true;
        }

        if (this.firstXiaZhuFlag) {
            this.firstXiaZhuUI.node.active = true;
        }
    },

    canCompare: function () {
        return (this.lookCardStatus && this.userInfo && !this.loseStatus && !this.giveUpStatus);
    },

    isPlayingGame: function () {
        return this.userInfo && !(this.loseStatus || this.giveUpStatus);
    },
    
    isLookedCard: function () {
        return this.lookCardStatus;
    }
});
