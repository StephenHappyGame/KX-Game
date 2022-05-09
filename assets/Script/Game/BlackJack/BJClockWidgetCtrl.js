let TWO_HAND_CARDS_OFFSET = 100;
cc.Class({
    extends: cc.Component,

    properties: {
        timeLabel: cc.Label
    },

    onLoad () {
    },
    
    startClock: function (time, operationType, callback) {
        this.node.active = true;
        this.curIndex = time;
        this.timeLabel.string = time.toString();
        this.schedule(function () {
            this.curIndex--;
            if (this.curIndex < 0){
                // 停止定时器
                this.unscheduleAllCallbacks();
                // 回调
                callback(operationType);
            }else{
                this.timeLabel.string = this.curIndex.toString();
            }
        }.bind(this), 1);
    },
    
    stopClock: function () {
        this.unscheduleAllCallbacks();
        this.node.active = false;
    }
});
