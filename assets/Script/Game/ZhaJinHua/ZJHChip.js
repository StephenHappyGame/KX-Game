let proto = require('./GameProtoZJH');

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

        numLabel: cc.Label,
        chipBg: cc.Sprite
    },

    onLoad: function () {

    },

    setStakeNum: function (stakeLevel, multiple) {
        let stakeNum = proto.STAKE_LEVEL[stakeLevel] * multiple;
        this.numLabel.string = stakeNum.toString();

        Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/ImgNew/ZJHChipBg', this.chipBg);
    }
});
