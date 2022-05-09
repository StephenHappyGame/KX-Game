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

        updateInfo: cc.Label,
        updateUI: cc.Node,
        manifestUrl: {
            type: cc.Asset,
            default: null
        },
        progress: cc.ProgressBar,
        progressText: cc.Label
    },

    checkCb: function (event) {
        cc.log('checkCb', event.getEventCode());
        this._updating = false;

        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.updateInfo.string = "No local manifest file found, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.updateInfo.string = "Fail to download manifest file, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.updateInfo.string = "已是最新版本，正在进入游戏...";
                this.enterGame();
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                this.updateInfo.string = '发现更新，开始下载更新';

                if (this.needBigUpdate) {
                    cc.log('this is a big version, please update!');
                    if (!!this.updateControl.bigUpdate && !!this.updateControl.forceBigUpdate) {
                        Global.DialogManager.addPopDialog('需要下载最新版本才能进行游戏！点击确定即可下载！', function () {
                            this.downloadGame();
                        }.bind(this));
                    } else {
                        this.hotUpdate();
                    }
                } else {
                    this.hotUpdate();
                }
                break;
            default:
                return;
        }

        this._am.setEventCallback(null);
        this._checkListener = null;
        this._updating = false;
    },

    updateCb: function (event) {
        cc.log('updateCb', event.getEventCode());
        let needRestart = false;
        let failed = false;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.updateInfo.string = 'No local manifest file found, hot update skipped.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                // event.getPercent();//总进度
                // event.getPercentByFile();//当前文件进度
                // event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                // event.getDownloadedBytes() + ' / ' + event.getTotalBytes();

                cc.log('下载更新中……', event.getPercent(), event.getDownloadedBytes(), event.getTotalBytes(), parseFloat(event.getDownloadedBytes()) / parseFloat(event.getTotalBytes()));
                let percent = parseFloat(event.getDownloadedBytes()) / parseFloat(event.getTotalBytes());
                this.updateInfo.string = '下载更新中，请稍后...';
                this.progress.progress = percent;
                this.progressText.string = parseInt(percent * 100) + '%';
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.updateInfo.string = 'Fail to download manifest file, hot update skipped.';
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.updateInfo.string = 'Already up to date with the latest remote version.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.updateInfo.string = 'Update finished. ' + event.getMessage();
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.updateInfo.string = 'Update failed. ' + event.getMessage();
                this._updating = false;
                this._canRetry = true;
                this._am.downloadFailedAssets();
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.updateInfo.string = 'Asset update error: ' + event.getAssetId() + ', ' + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.updateInfo.string = event.getMessage();
                break;
            default:
                break;
        }

        if (failed) {
            this._am.setEventCallback(null);
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            this._am.setEventCallback(null);
            this._updateListener = null;
            // Prepend the manifest's search path
            let searchPaths = jsb.fileUtils.getSearchPaths();
            let newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log(JSON.stringify(newPaths));
            Array.prototype.unshift(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    },

    retry: function () {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;

            this.updateInfo.string = 'Retry failed Assets...';
            this._am.downloadFailedAssets();
        }
    },

    hotUpdate: function () {
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCb.bind(this));

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                this._am.loadLocalManifest(this.manifestUrl.nativeUrl);
            }

            this.updateUI.active = true;
            this._am.update();
            this._updating = true;
        }
    },

    checkUpdate: function () {
        if (this._updating) {
            this.updateInfo.string = 'Checking or updating ...';
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            this._am.loadLocalManifest(this.manifestUrl.nativeUrl);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            this.updateInfo.string = 'Failed to load local manifest ...';
            return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));
        /*this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
        cc.eventManager.addListener(this._checkListener, 1);*/

        this._am.checkUpdate();
        this._updating = true;
    },

    goCheck: function () {
        console.log("goCheck()");
        this.updateInfo.string = '检查更新中，请稍后...';

        let storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'test-remote-asset');
        cc.log('Storage path for remote asset : ' + storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        this.versionCompareHandle = function (versionA, versionB) {
            cc.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            let vA = versionA.split('.');
            let vB = versionB.split('.');

            //vA   {1, 0, 1}
            //vB   {1, 0, 2}
            //大版本号检测
            if (vA[0] < vB[0]) {
                this.needBigUpdate = true;
            }

            for (let i = 0; i < vA.length; ++i) {
                let a = parseInt(vA[i]);
                let b = parseInt(vB[i] || 0);
                if (a === b) {
                }
                else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        }.bind(this);

        this._am = new jsb.AssetsManager(this.manifestUrl.nativeUrl, storagePath, this.versionCompareHandle);
        /*if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.retain();
        }*/

        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            let compressed = asset.compressed;
            // Retrieve the correct md5 value.
            let expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            let relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            let size = asset.size;
            if (compressed) {
                //this.updateInfo.string = "Verification passed : " + relativePath;
                return true;
            }
            else {
                //this.updateInfo.string = "Verification passed : " + relativePath + ' (' + expectedMD5 + ')';
                return true;
            }
        });

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am.setMaxConcurrentTask(2);
        }

        this.checkUpdate();
    },

    closeGame: function () {
        cc.game.end();
    },

    enterGame: function () {
        if (!!this.dialogParameters && !!this.dialogParameters.cb) {
            this.dialogParameters.cb();
        }
        Global.DialogManager.destroyDialog(this);
    },

    downloadGame: function () {
        cc.sys.openURL(this.updateControl.bigUpdateDownloadUrl);
    },

    // use this for initialization
    onLoad: function () {
        this.updateInfo.string = '游戏初始化中...';
        this._updating = false;
        this._canRetry = false;
        this.needBigUpdate = false;
        this.updateControl = {};
        this.updateUI.active = false;

        // updateControl
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 400)) {
                let response = xhr.responseText;
                this.updateControl = JSON.parse(response);
                cc.log(response);
                if (!!this.updateControl.hotUpdate) {
                    this.goCheck();
                } else {
                    this.enterGame();
                }
            } else {
                //get updateControl fail, please check your network
            }
        }.bind(this);
        xhr.open("GET", Global.Constant.webServerAddress + "/hot-update/updateControl.json", true);
        xhr.send();
        cc.log(Global.Constant.webServerAddress + "/hot-update/updateControl.json");
    },

    onDestroy: function () {
        if (this._updateListener) {
            this._am.setEventCallback(null);
            this._updateListener = null;
        }
        /*if (this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.release();
        }*/
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
