cc.Class({
	extends: cc.Component,
	properties: {
		niu0: cc.AudioSource,
		niu1: cc.AudioSource,
		niu2: cc.AudioSource,
		niu3: cc.AudioSource,
		niu4: cc.AudioSource,
		niu5: cc.AudioSource,
		niu6: cc.AudioSource,
		niu7: cc.AudioSource,
		niu8: cc.AudioSource,
		niu9: cc.AudioSource,
		niu10: cc.AudioSource,
		wuhuaniu: cc.AudioSource,
		zhadanniu: cc.AudioSource,
		wuxiaoniu: cc.AudioSource,
		backMusic: cc.AudioSource,
		pourGold: cc.AudioSource,
		tick: cc.AudioSource,
	},

	start: function () {
		this.setVolume();
		//this.backMusic.loop = true;
		//this.backMusic.play();
		Global.AudioManager.startPlayBgMusic('Niuniu/Audio/back');
	},

	onDestroy: function () {
		Global.AudioManager.stopBgMusic();
		//this.backMusic.stop();
	},

	playNiuType: function (num) {
		var array = [this.niu0, this.niu1, this.niu2, this.niu3, this.niu4,
			this.niu5, this.niu6, this.niu7, this.niu8, this.niu9, this.niu10 ];
		var audioSource = array[num];
		audioSource.play();
	},

	playWuhuaniu: function () {
		this.wuhuaniu.play();
	},

	playZhadanniu: function () {
		this.zhadanniu.play();
	},

	playWuxiaoniu: function () {
		this.wuxiaoniu.play();
	},

	playPourGold: function () {
		this.pourGold.play();
	},

	playTick: function () {
		this.tick.play();
	},

	setVolume: function () {
	    var volume = Global.AudioManager.getSoundVolume();
		var array = [ this.niu0, this.niu1, this.niu2, this.niu3, this.niu4, this.niu5, this.niu6,
			this.niu7, this.niu8, this.niu9, this.niu10, this.wuhuaniu, this.zhadanniu,
			this.wuxiaoniu, this.pourGold, this.tick ];
		for(var i = 0; i < array.length; ++i) {
			array[i].volume = volume;
		}
	},
});
