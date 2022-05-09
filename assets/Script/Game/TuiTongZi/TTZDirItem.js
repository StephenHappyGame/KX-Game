cc.Class({
	extends: cc.Component,
	properties: {
		labelZhuang: cc.Label,
		labelTian: cc.Label,
		labelZhong: cc.Label,
		labelDi: cc.Label,
	},

	start: function () { 

	},

	setLabel: function (strArr) {
		var labelArr = [this.labelZhuang, this.labelTian, this.labelZhong, this.labelDi];
		for(var i = 0; i < labelArr.length; ++i) {
			labelArr[i].string = strArr[i];
		}
	},
});
