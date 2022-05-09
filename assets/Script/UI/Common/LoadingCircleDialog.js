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
        circle: cc.Node
    },

    // use this for initialization
    onLoad: function () {
        this.loadingCoinAnimationNode = null;
    },

    addLoadingCircle: function (delay){
        //cc.log('显示loading');
        this.node.active = true;
        //this.circle.stopAllActions();
        //this.circle.runAction(cc.repeatForever(cc.rotateBy(2, 360, 360)));
        if(!this.loadingCoinAnimationNode){
            Global.Animation.createFrameAnimationNode("Loading/loading_coin", function (err, node) {
                if(!err){
                    this.loadingCoinAnimationNode = node;
                    this.loadingCoinAnimationNode.parent = this.node;
                    if (this.node.active){
                        this.loadingCoinAnimationNode.startAnimation(true);
                    }
                }
            }.bind(this));
        }else{
            this.loadingCoinAnimationNode.startAnimation(true);
        }
    },

    removeLoadingCircle: function (){
        //cc.log('移除loading');

        // this.circle.stopAllActions();
        if(!!this.loadingCoinAnimationNode){
            this.loadingCoinAnimationNode.stopAnimation();
        }
        this.node.active = false;
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
