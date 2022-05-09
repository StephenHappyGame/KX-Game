cc.Class({
	extends: cc.Component,
	properties: {
		nameLabel: cc.Label,
		goldLabel: cc.Label,
	},

	start: function () {
	},

	setNameAndGold: function (name, gold) {
		this.nameLabel.string = name;
		this.goldLabel.string = gold.toFixed(2);
	},
});
