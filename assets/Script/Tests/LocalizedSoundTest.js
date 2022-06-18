const Translator = require("Translator");
const AudioManager = require("../Shared/AudioManager")

cc.Class({
    extends: cc.Component,

    properties: {
        lbCurrentLanguage: {
            default: null,
            type: cc.Label
        }
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
    },

    _initLanguage(lang, updateRenderers = false) {
        try {
            Translator.init(lang);
            if(updateRenderers) Translator.updateSceneRenderers();

            this.lbCurrentLanguage.string = `- ${lang}`;

            console.log(`Changed current language to ${lang} successfully`)
        } catch(error) {
            cc.error(error);

            this.lbCurrentLanguage.string = `- ${Translator.getCurrentLanguage()}`;
        }
    },

    onLoad() {
        AudioManager.init();

        this._initLanguage("en_US");
    },

    onChangeLanguageButtonClicked(event, customEventData) {
        this._initLanguage(customEventData, true);
    },

    onSoundButtonClicked(event) {
        AudioManager.playCommonSoundClickButtonLocalized()
    }
});
