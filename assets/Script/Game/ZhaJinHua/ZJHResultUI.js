var proto = require('./GameProtoZJH');

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...

        fonts: {
            type: [cc.Sprite],
            default: []
        },
    },

    showWinType: function (cardType) {
        var offsetX = 30;
        var startX = -30;
        this.fonts[this.fonts.length - 1].node.active = false;
        var imgName = ['', '', '', 'card_type_font_ying'];
        switch (cardType) {
            case (proto.CARD_TYPE_BAO_ZI):
                imgName[0] = 'card_type_font_bao';
                imgName[1] = 'card_type_font_zi';
                imgName[2] = 'card_type_font_ying';
                break;
            case (proto.CARD_TYPE_TONG_HUA_SHUN):
                imgName[0] = 'card_type_font_tong';
                imgName[1] = 'card_type_font_hua';
                imgName[2] = 'card_type_font_shun';
                this.fonts[this.fonts.length - 1].node.active = true;
                startX = -45;
                break;
            case (proto.CARD_TYPE_TONG_HUA):
                imgName[0] = 'card_type_font_tong';
                imgName[1] = 'card_type_font_hua';
                imgName[2] = 'card_type_font_ying';
                break;
            case (proto.CARD_TYPE_SHUN_ZI):
                imgName[0] = 'card_type_font_shun';
                imgName[1] = 'card_type_font_zi';
                imgName[2] = 'card_type_font_ying';
                break;
            case (proto.CARD_TYPE_DUI_ZI):
                imgName[0] = 'card_type_font_dui';
                imgName[1] = 'card_type_font_zi';
                imgName[2] = 'card_type_font_ying';
                break;
            case (proto.CARD_TYPE_DAN_ZHANG):
                imgName[0] = 'card_type_font_gao';
                imgName[1] = 'card_type_font_pai';
                imgName[2] = 'card_type_font_ying';
                break;
        }

        for (var i = 0; i < this.fonts.length; i ++) {
            this.fonts[i].node.active = false;
        }
    },

    // use this for initialization
    onLoad: function () {
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
