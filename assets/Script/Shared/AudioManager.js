const Translator = require('Translator');
var constant = require('./Constant');

/**
 * Controlls all audio in the game.
 * It can play the background music and play custom and common sounds.
 * 
 * Changing music volume and sound volume can be done using this class.
 * 
 * @category Managers
 * @exports AudioManager
 */
var AudioManager = module.exports = {};

/** 
 * @type { number | cc.AudioClip }
 * 
 * Current background music clip. *-1* if no current music. 
 */
AudioManager.currentBgMusic = -1;

/** 
 * @type { boolean }
 * 
 * Indicates if music is enabled. 
 */
AudioManager.isMusicEnabled = true;
/** 
 * @type { boolean }
 * 
 * Indicates if sound is enabled. 
 */
AudioManager.isSoundEnabled = true;

/** 
 * @type { number } 
 * 
 * Volume of the music. 
 * */
AudioManager.musicVolume = 1;
/** 
 * @type { number } 
 * 
 * Volume of the sound. 
 */
AudioManager.soundVolume = 1;

/** 
 * List of paths to common sounds.
 * 
 * @type { object }
 * @property { string } clickButtonSound - Path to click button sound.
 */
AudioManager.commonSoundPath = {
    clickButtonSound: 'Hall/Sound/button'
};

/**
 * Cached common sounds.
 * 
 * @type { object }
 * @property { cc.AudioClip } clickButton - Cached click button sound.
 */
AudioManager.commonSound = {
    clickButton: null
};

/**
 * Initializes *AudioManager*.
 * 
 * Checks for **Music**, **Sound**, **MusicVolume** and **SoundVolume** in the local storage and sets in-game values
 * accordingly.
 * 
 * *For now, the sound and music is always set on from the beginning.*
 */
AudioManager.init = function () {
    this.setSoundOn();
    this.setMusicOn();

    if (cc.sys.localStorage.getItem('Music') == 0) {
        this.isMusicEnabled = false;
    } else {
        cc.sys.localStorage.setItem('Music', 1);
    }

    if (cc.sys.localStorage.getItem('Sound') == 0) {
        this.isSoundEnabled = false;
    } else {
        cc.sys.localStorage.setItem('Sound', 1);
    }

    if (cc.sys.localStorage.getItem('MusicVolume') === null) {
        cc.sys.localStorage.setItem('MusicVolume', this.musicVolume);
        cc.sys.localStorage.setItem('SoundVolume', this.soundVolume);
    } else {
        this.musicVolume = parseFloat(cc.sys.localStorage.getItem('MusicVolume'));
        this.soundVolume = parseFloat(cc.sys.localStorage.getItem('SoundVolume'));
    }
};

/**
 * Loads music from specified *url* and plays the music if it's enabled.
 * 
 * If *url* isn't specified, the *url* will be equal to **DEFAULT_BG_MUSIC_PATH** from {@link module:Constant}.
 * 
 * @param { string? } url - Path to the music clip
 * @param { function? } cb - Callback that will pass the error if error occurred, or null if loading was successful
 */
AudioManager.startPlayBgMusic = function (url, cb) {
    if (!url) url = constant.DEFUALT_BG_MUSIC_PATH;

    AudioManager.stopBgMusic();
    cc.loader.loadRes(url, function (err, clip) {
        if(!!err) {
            cc.log('StartPlayBgMusic Failed');
        } else {
            AudioManager.currentBgMusic = cc.audioEngine.play(clip, true, AudioManager.isMusicEnabled ? AudioManager.musicVolume : 0);

            if (!AudioManager.isMusicEnabled) {
                cc.audioEngine.pause(AudioManager.currentBgMusic);
            }
        }
        if(!!cb) cb(err);
    });
};

/**
 * Stops background music.
 */
AudioManager.stopBgMusic = function() {
    if (this.currentBgMusic === null || this.currentBgMusic < 0) return;
    cc.audioEngine.stop(this.currentBgMusic);
    this.currentBgMusic = -1;
};

/**
 * Loads and plays sound from specified *url*.
 * The sound will loop if *loop* is true.
 * 
 * TODO: I think, we will have to change the dynamic loading system, even to load only for the first time and then cache,
 * because it's pretty expensive to load the sound everytime it has to play.
 * 
 * @param {string} url - Path to the sound clip
 * @param {boolean} loop - Whether clip will loop or not
 */
AudioManager.playSound = function(url, loop){
    if (!url || !AudioManager.isSoundEnabled) return;
    if (loop !== true) loop = false;

    cc.loader.loadRes(url, function (err, clip) {
        if (!!err) {
            cc.error(`PlaySound ${url} failed`);
        } else{
            cc.audioEngine.play(clip, loop, AudioManager.soundVolume);
        }
    });
};

/**
 * The only common sound is *clickButton*.
 * If it wasn't loaded previously, it will load the sound from hardcoded URL and then play the sound.
 * If it was loaded previously, it will play the sound (without loop).
 */
AudioManager.playCommonSoundClickButton = function () {
    if(!AudioManager.isSoundEnabled) return;
    if(AudioManager.commonSound.clickButton !== null) {
        cc.audioEngine.play(AudioManager.commonSound.clickButton, false, AudioManager.soundVolume);
    } else {
        cc.loader.loadRes(AudioManager.commonSoundPath.clickButtonSound, function (err, clip) {
            if(!!err) {
                cc.log("playCommonSoundClickButton failed");
            } else {
                AudioManager.commonSound.clickButton = clip;
                cc.audioEngine.play(AudioManager.commonSound.clickButton, false, AudioManager.soundVolume);
            }
        });
    }
};

AudioManager.playCommonSoundClickButtonLocalized = function() {
    if(!AudioManager.isSoundEnabled) return;
    if(!Translator.isInitialized()) return

    const path = Translator.translate("commonButtonSoundPath");
    cc.loader.loadRes(path, function(err, clip) {
        if(err) cc.error(`Sound with path ${path} doesn't exist for language ${Translator.getCurrentLanguage()}`)
        else {
            cc.audioEngine.play(clip, false, AudioManager.soundVolume)
        }
    })
}

/**
 * Sets local storage **Music** item to 1, maxes out background music volume and resumes playing it.
 */
AudioManager.setMusicOn = function () {
    cc.sys.localStorage.setItem('Music', 1);
    cc.audioEngine.setVolume(this.currentBgMusic, 1);
    cc.audioEngine.resume(this.currentBgMusic);
    this.isMusicEnabled = true;
};

/**
 * Sets local storage **Music** item to 0 and sets background music volume to 0.
 */
AudioManager.setMusicOff = function () {
    cc.sys.localStorage.setItem('Music', 0);
    cc.audioEngine.setVolume(this.currentBgMusic, 0);
    this.isMusicEnabled = false;
};

/**
 * Check if music is enabled.
 * 
 * @returns { boolean }
 */
AudioManager.getMusicEnabled = function () {
    return this.isMusicEnabled;
};

/**
 * Sets local storage **Sound** item to 1 and allows sound playing.
 */
AudioManager.setSoundOn = function () {
    cc.sys.localStorage.setItem('Sound', 1);
    this.isSoundEnabled = true;
};

/**
 * Sets local storage **Sound** item to 0 and disallows sound playing.
 */
AudioManager.setSoundOff = function () {
    cc.sys.localStorage.setItem('Sound', 0);
    this.isSoundEnabled = false;
};

/**
 * Checks if sound is enabled.
 * 
 * @returns { boolean }
 */
AudioManager.getSoundEnabled = function () {
    return this.isSoundEnabled;
};

/**
 * Sets music volume to *volume* and updates **MusicVolume** item in local storage.
 * It also updates current volume of the background music.
 * 
 * @param { float } volume - Expected music volume
 */
AudioManager.setMusicVolume = function (volume) {
    this.musicVolume = parseFloat(volume.toFixed(1));
    if (this.musicVolume === parseFloat(cc.sys.localStorage.getItem('MusicVolume'))) {
    } else {
        cc.sys.localStorage.setItem('MusicVolume', this.musicVolume);
    }

    if (AudioManager.currentBgMusic >= 0){
        cc.audioEngine.setVolume(AudioManager.currentBgMusic, this.musicVolume);
    }
};

/**
 * Gets music volume.
 * 
 * @returns { float }
 */
AudioManager.getMusicVolume = function () {
    return this.musicVolume;
};

/**
 * Sets sound volume to *volume* and updates **SoundVolume** item in local storage.
 * 
 * @param { float } volume - Expected sound volume
 */
AudioManager.setSoundVolume = function (volume) {
    this.soundVolume = parseFloat(volume.toFixed(1));
    if (this.soundVolume === parseFloat(cc.sys.localStorage.getItem('SoundVolume'))) {
    } else {
        cc.sys.localStorage.setItem('SoundVolume', this.soundVolume);
    }
};

/**
 * Gets sound volume.
 * 
 * @returns { float }
 */
AudioManager.getSoundVolume = function () {
    return this.soundVolume;
};
