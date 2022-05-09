cc.Class({
    extends: cc.Component,

    properties: {
        timeLabel: cc.Label,
        tipsLabel: cc.Label
    },

    start () {

    },

    startClock(time, tips){
        this.time = time;
        this.tipsLabel.string = tips;

        this.unscheduleAllCallbacks();
        this.timeLabel.string = this.time.toString();
        this.schedule(function () {
            this.time--;
            if (this.time >= 0){
                this.timeLabel.string = this.time.toString();
            }else{
                this.unscheduleAllCallbacks();
            }
        }.bind(this), 1);
    },
    
    resetWidget: function () {
        this.tipsLabel.string = "";
        this.timeLabel.string = "15";
        this.unscheduleAllCallbacks();
    }
});
