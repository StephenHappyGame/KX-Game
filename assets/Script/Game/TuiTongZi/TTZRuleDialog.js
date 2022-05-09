cc.Class({
    extends: cc.Component,

    properties: {

    },

	start: function () { },

	onButtonClick: function (event, param) {
		if(param === 'close') {
			Global.DialogManager.destroyDialog(this, true);
		}
	},
});
