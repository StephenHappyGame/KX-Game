cc.Class({
	extends: cc.Component,
	properties: {
		bankerBg: cc.Node,
		nameLabel: cc.Label,
		goldLabel: cc.Label,
	},

	start: function () { },

	setNameAndGold: function (name, gold, isBanker) {
		this.bankerBg.active = isBanker;
		this.nameLabel.string = name;
		this.goldLabel.string = gold;
	},
});
