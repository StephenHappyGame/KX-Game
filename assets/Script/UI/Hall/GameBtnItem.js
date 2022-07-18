const Translator = require("Translator");

cc.Class({
    extends: cc.Component,

    properties: {
        spBtn1: sp.Skeleton,
        spBtn2: sp.Skeleton
    },

    onLoad: function () {
        this.spBtn1.node.active = false;
        this.spBtn2.node.active = false;
    },

    /**
     * This function will replace specified **skeleton** with SkeletonData loaded from
     * *'Hall/btn_game_**gameId**'*. Default skin will be assigned as *en* and animation will
     * be set to *animation*.
     * 
     * @param {number} gameId - Game ID
     * @param {sp.Skeleton} skeleton - SkeletonData will be attached to this Skeleton
     */
    _replaceSpine(gameId, skeleton) {
        cc.loader.loadRes('Hall/btn_game_' + gameId, sp.SkeletonData, (error, asset) => {
            if(error) {
                console.error(error);
                return;
            }

            skeleton.skeletonData = asset;
            skeleton.setSkin(Translator.getCurrentLanguage());
            skeleton.setAnimation(0, "animation", true);

            skeleton.node.active = true;

            console.log(`Successfully attached ${gameId} SkeletonData to ${skeleton.node.name}`);
        });
    },
    
    updateUI: function (data, callback) {
        this.data = data;
        this.callback = callback;

        if(data.game1) this._replaceSpine(data.game1, this.spBtn1);
        if(data.game2) this._replaceSpine(data.game2, this.spBtn2);
    },
    
    onBtnClk: function (event, param) {
        let game = '';
        switch (param) {
            case 'game1':
                game = this.data.game1;
                break;
            case 'game2':
                game = this.data.game2;
                break;
        }

        if (!!this.callback) {
            this.callback(game);
        }
    }
});
