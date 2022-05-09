let ZJHAudio = require('./ZJHAudio');

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

        touchFrame: cc.Prefab
    },

    clearWidget: function () {
        if (!!this.touchWidgetArr){
            for (let i = 0; i < this.touchWidgetArr.length; ++i){
                this.touchWidgetArr[i].destroy();
            }
            this.touchWidgetArr = [];
        }
        this.node.active = false;
    },

    addSelectEff: function (posIndex, pos, chairId, cb) {
        let touch = cc.instantiate(this.touchFrame);
        touch.parent = this.node;
        touch.getComponent(cc.Animation).play('selectEff');
        touch.x = pos.x;
        touch.y = pos.y - 30;

        this.touchWidgetArr.push(touch);

        // let offsetX = 0;
        if (posIndex === 1 || posIndex === 2) {
            // touch.x += -offsetX;
            touch.getChildByName('anmi').x = -touch.getChildByName('anmi').x;
            touch.getChildByName('anmi').scaleX = -1;
        } /*else if (posID === ZJHModel.POS_LEFT_BOTTOM || ZJHModel.POS_LEFT_TOP || posID === ZJHModel.POS_TOP) {
            // touch.x += offsetX;
        }*/

        touch.once(cc.Node.EventType.TOUCH_START, function () {
            ZJHAudio.compare();
            Global.Utils.invokeCallback(cb, chairId);
        })
    },

    // use this for initialization
    onLoad: function () {
        this.touchWidgetArr = [];
    }
});
