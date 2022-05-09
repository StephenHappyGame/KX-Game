var proto = require('./GameProtoZJH');
var ZJHAudio = require('./ZJHAudio');

cc.Class({
    extends: cc.Component,

    properties: {
        chip: cc.Prefab,
        chipSumAmountLabel: cc.Label,
        roundLabel: cc.Label,
        poolInfoGroup: cc.Node
    },

    onLoad: function () {
        this.hidePoolInfoGroup();
        this.chips = [];
    },

    setChips: function (goldSumAmount, round, stakeArr) {
        for (let i = 0; i < proto.MAX_ROUND; i ++) {
            for (let j = 0; j < stakeArr.length; j ++) {
                if (!!stakeArr[j] && !!stakeArr[j][i]) {
                    let chip = cc.instantiate(this.chip);
                    chip.parent = this.node;
                    chip.getComponent('ZJHChip').setStakeNum(0, stakeArr[j][i]);
                    chip.x = -this.node.width / 2 + Math.random() * this.node.width;
                    chip.y = -this.node.height / 2 + Math.random() * this.node.height;

                    this.chips[this.chips.length] = chip;
                }
            }
        }
        this.chipSumAmountLabel.string = goldSumAmount.toFixed(2);
        this.roundLabel.string = Global.Utils.stringFormat('第{0}/{1}轮', round, proto.MAX_ROUND);
    },

    addChip: function (currentStakeLevel, multiple, goldSumAmount, round, chairPos) {
        let chip = cc.instantiate(this.chip);
        chip.parent = this.node;
        chip.getComponent('ZJHChip').setStakeNum(currentStakeLevel, multiple);

        chip.x = chairPos.x - this.node.x;
        chip.y = chairPos.y - this.node.y;

        let destX = -this.node.width / 2 + Math.random() * this.node.width;
        let destY = -this.node.height / 2 + Math.random() * this.node.height;

        chip.runAction(cc.moveTo(0.7, destX, destY).easing(cc.easeQuinticActionOut()));

        this.chips[this.chips.length] = chip;

        this.chipSumAmountLabel.string = goldSumAmount.toFixed(2);
        this.roundLabel.string = Global.Utils.stringFormat('第{0}/{1}轮', round, proto.MAX_ROUND);
    },

    collectChips: function (chairPos) {
        for (let i = 0; i < this.chips.length; i ++) {
            let delay = cc.delayTime(0.2 + i * 0.02);
            let move = cc.moveTo(0.5, chairPos.x - this.node.x, chairPos.y - this.node.y).easing(cc.easeQuinticActionOut());
            let fadeOut = cc.fadeOut(0.1);
            let sequence = cc.sequence([delay, move, fadeOut]);

            this.chips[i].runAction(sequence);
        }

        ZJHAudio.shouJi();
    },

    showPoolInfoGroup: function () {
        this.poolInfoGroup.active = true;
    },

    hidePoolInfoGroup: function () {
        this.poolInfoGroup.active = false;
    },

    //移除所有筹码
    removeAllChips: function () {
        for (let i = 0; i < this.chips.length; i ++) {
            this.chips[i].destroy();
        }
        this.chips = [];
        this.chipSumAmountLabel.string = "0";
        this.roundLabel.string = Global.Utils.stringFormat('第{0}/{1}轮', 0, proto.MAX_ROUND);
    }
});
