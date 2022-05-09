cc.Class({
    extends: cc.Component,

    properties: {
        text: cc.Label
    },

    onLoad: function () {

    },

    updateUI: function (data) {
        this.text.string = data.text;

        if (data.typ === 'des') {
            this.text.fontSize = 24;
            this.text.node.color = cc.Color.WHITE;
            this.text.string = data.text;
        }
    },
});
