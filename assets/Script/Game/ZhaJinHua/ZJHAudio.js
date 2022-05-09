var AudioManager = require('../../Shared/AudioManager');
var ZJHAudio = module.exports = {};

// ZJHAudio.DIR_URL = 'resources/ZhaJinHua/audio/';
ZJHAudio.DIR_URL = 'Game/ZhaJinHua/audio/';
ZJHAudio.SEX = 'f_';

ZJHAudio.randomNum = function (randomRange) {
    return Math.floor(Math.random() * 100) % randomRange;
};

ZJHAudio.play = function (filePath_, loop_, volume_) {
    // var filePath = cc.url.raw(ZJHAudio.DIR_URL + filePath_ + '.mp3');
    var filePath = ZJHAudio.DIR_URL + filePath_;
    var loop = loop_;
    var volume = volume_ || null;
    //return cc.audioEngine.play(filePath, !!loop, volume);
    return AudioManager.playSound(filePath, !!loop);
};


//非人声音效
ZJHAudio.chip = function () {
    this.play('chip');
};

ZJHAudio.compareDian = function () {
    this.play('compare_dian');
};

ZJHAudio.compareFailure = function () {
    this.play('compare_failure');
};

ZJHAudio.compareVictory = function () {
    this.play('compare_victory');
};

ZJHAudio.faPai = function () {
    this.play('fapai');
};

ZJHAudio.foldPai = function () {
    this.play('foldpai');
};

ZJHAudio.shouJi = function () {
    this.play('shouji');
};

//人声音效
ZJHAudio.compare = function () {
    var fileName = 'compare' + this.randomNum(2);
    this.play(ZJHAudio.SEX + fileName);
};

ZJHAudio.genZhu = function () {
    var fileName = 'genzhu' + this.randomNum(2);
    this.play(ZJHAudio.SEX + fileName);
};

ZJHAudio.giveUp = function () {
    this.play(ZJHAudio.SEX + 'giveup');
};

ZJHAudio.jiaZhu = function () {
    var fileName = 'jiazhu' + this.randomNum(2);
    this.play(ZJHAudio.SEX + fileName);
};

ZJHAudio.jiaZhuMax = function () {
    this.play(ZJHAudio.SEX + 'jiazhumax');
};

ZJHAudio.kanPai = function () {
    var fileName = 'kanpai' + this.randomNum(2);
    this.play(ZJHAudio.SEX + fileName);
};

ZJHAudio.xiaZhu = function () {
    var fileName = 'xiazhu' + this.randomNum(2);
    this.play(ZJHAudio.SEX + fileName);
};

ZJHAudio.xuePin = function () {
    this.play(ZJHAudio.SEX + 'xuepin');
};

//背景音乐
ZJHAudio.gameBg = function () {
    return AudioManager.startPlayBgMusic(ZJHAudio.DIR_URL + 'gamebg');
};