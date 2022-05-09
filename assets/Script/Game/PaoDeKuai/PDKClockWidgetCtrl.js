cc.Class({
    extends: cc.Component,

    properties: {
        clockTime: cc.Label
    },

    onLoad: function () {
    },
    
    startClock: function (time, callback) {
        this.unscheduleAllCallbacks();
        this.curTime = time;
        this.callback = callback;
        this.clockTime.string = this.curTime.toString();
        this.schedule(this.updateClock.bind(this), 1);
    },

    stopClock: function () {
        this.unscheduleAllCallbacks();
    },
    
    updateClock: function () {
        this.curTime--;
        if (this.curTime < 0){
            this.unscheduleAllCallbacks();
            Global.Utils.invokeCallback(this.callback);
        }else{
            this.clockTime.string = this.curTime.toString();
            if (this.curTime === 5){
                Global.AudioManager.playSound("Game/PaoDeKuai/Sound/sound_remind");
            }
        }
    },

    setClockEnd: function () {
        this.curTime = 0;
    }
});
