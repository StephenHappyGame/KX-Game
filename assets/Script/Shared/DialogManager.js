/**
 * Controls all of the dialogs in the scene.
 * It can be used to create and detroy dialogs, show and remove loading circle as well as show popups and tips.
 * 
 * @category Managers
 * @exports DialogManager
 */
let DialogManager = {};

/**
 * Initializes `DialogManager` with *rootNode* that has to contains *dialogNode* and *frontNode* children.
 * *frontNode* also has to contain *LoadingCircleDialog* with `LoadingCircleDialog` component, *PopDialog* with `PopDialog` and
 * *TipDialog* with `TipDialog`, because all of them are used by `DialogManager` in other functions.
 * 
 * Listens to *DesignResolutionChanged* route.
 * 
 * @param {cc.Node} rootNode - node that contains *dialogNode* and *frontNode* children. Both of them will be used
 * to display all dialogs.
 */
DialogManager.init = function (rootNode) {
    /**
     * RootNode of the *dialogNode* and *frontNode*.
     * 
     * @static
     * @type {cc.Node}
     */
    this.rootNode = rootNode;

    /**
     * Main dialog node, where all of the created dialogs will be stored.
     * 
     * @static
     * @type {cc.Node}
     */
    this.dialogNode = this.rootNode.getChildByName("dialogNode");
    this.dialogNode.width  = rootNode.width;
    this.dialogNode.height  = rootNode.height;
    
    /**
     * Main front node, where loading circle, popups and tips are stored.
     * 
     * @static
     * @type {cc.Node}
     */
    this.frontNode = this.rootNode.getChildByName("frontNode");
    this.frontNode.width  = rootNode.width;
    this.frontNode.height  = rootNode.height;

    /**
     * Stores every loaded dialog prefab.
     * 
     * @static
     * @type {cc.Prefab[]}
     */
    this.loadedDialogPrefabs = {};

    /**
     * Stores every created dialog node.
     * 
     * @static
     * @type {cc.Node[]}
     */
    this.createdDialogs = {};

    this.loadingCircleDialog = this.frontNode.getChildByName("LoadingCircleDialog").getComponent('LoadingCircleDialog');
    this.popDialog = this.frontNode.getChildByName("PopDialog").getComponent('PopDialog');
    this.tipDialog = this.frontNode.getChildByName("TipDialog").getComponent('TipDialog');

    Global.MessageCallback.addListener("DesignResolutionChanged", this);
};

/**
 * Handles *DesignResolutionChanged* route by updating the dialog size with new resolution.
 * 
 * @param {string} route - should always be *DesignResolutionChanged*
 * @param {any} msg - *DesignResoltionChanged* message
 */
DialogManager.messageCallbackHandler = function (route, msg) {
    if (route === "DesignResolutionChanged"){
        DialogManager.updateDialogNodeSize(msg);
    }
};

/**
 * Updates *dialogNode* and *frontNode* size with specified *size*.
 * 
 * @param {object} size - New size
 * @param {number} size.width - Width
 * @param {number} size.height - Height
 */
DialogManager.updateDialogNodeSize = function (size) {
    this.dialogNode.width  = size.width ;
    this.dialogNode.height  = size.height ;

    this.frontNode.width  = size.width ;
    this.frontNode.height  = size.height ;
};

/**
 * Creates dialog with *dialogRes* name and *params* parameters.
 * Invoked *cb* callback with specified error if failed or
 * with dialog node if succeeded.
 * 
 * @param {string} dialogRes - name of the dialog
 * @param {any} params - parameters for the created dialog
 * @param {function} cb - callback
 */
DialogManager.createDialog = function (dialogRes, params, cb) {
    cc.log(`Create Dialog ${dialogRes}`);

    let fileName = dialogRes;
    let arr = dialogRes.split('/');
    let dialogType = arr[arr.length-1]; // name of the dialog component (ex. Login/LoginDialog -> LoginDialog)

    // passed invalid dialogRes
    if (!dialogRes){
        cc.error(`Create Dialog ${dialogRes}: Dialog type is NULL`);
        Global.Utils.invokeCallback(cb, Global.Code.FAIL);
        return;
    }

    let createdDialogs = this.createdDialogs;
    let createDialog = createdDialogs[dialogRes] || null;
    if (!!createDialog) { // dialog already exists
        cc.error(`Create Dialog ${dialogRes}: Dialog already exists!`);
        createDialog.zIndex += 5; // try to close up the dialog if it's hidden
        Global.Utils.invokeCallback(cb, null, createDialog);
    } else {
        let loadedDialogPrefabs = this.loadedDialogPrefabs;
        if (!!loadedDialogPrefabs[dialogRes]) { // dialog prefab was previously loaded
            // TODO duplicated code, can be put into the helper function
            createDialog = cc.instantiate(loadedDialogPrefabs[dialogRes]);
            createdDialogs[dialogRes] = createDialog;
            createDialog.getComponent(dialogType).dialogParameters = params || {};
            createDialog.getComponent(dialogType).isDestroy = false;
            createDialog.parent = this.dialogNode;
            Global.Utils.invokeCallback(cb, null, createDialog);
        } else { // dialog prefab wasn't loaded
            cc.loader.loadRes(fileName, function(err, data){
                if(!!err) {
                    cc.error(err);
                    Global.Utils.invokeCallback(cb, err);
                } else {
                    loadedDialogPrefabs[dialogRes] = data;
                    // TODO duplicated code, can be put into the helper function
                    createDialog = cc.instantiate(data);
                    createdDialogs[dialogRes] = createDialog;
                    createDialog.getComponent(dialogType).dialogParameters = params || {};
                    createDialog.getComponent(dialogType).isDestroy = false;
                    createDialog.parent = this.dialogNode;
                    Global.Utils.invokeCallback(cb, null, createDialog);
                }
            }.bind(this));
        }
    }
};

/**
 * Checks if *dialogRes* dialog was already created.
 * 
 * @param {string} dialogRes - name of the dialog
 * @returns {boolean}
 */
DialogManager.isDialogExit = function(dialogRes) {
    return !!this.createdDialogs[dialogRes];
};

/**
 * Adds specified *dialog* with *dialogType* name to the `DialogManager`.
 * It won't add the dialog if *dialogType* member already exists.
 * 
 * @param {string} dialogType - name of the dialog
 * @param {Object} dialog - dialog node that will be added to created dialogs
 */
DialogManager.addDialogToManager = function (dialogType, dialog) {
    this.createdDialogs[dialogType] = this.createdDialogs[dialogType] || dialog;
};

/**
 * Destroy dialog with *dialogRes* name.
 * If *isClearPrefabs* is set, it will also destroy associated dialog prefab.
 * 
 * @param {string | cc.Component} dialogRes - name of the dialog or the dialog component object
 * @param {boolean} isClearPrefabs - whether destroy associated prefab or not
 */
DialogManager.destroyDialog = function (dialogRes, isClearPrefabs) {
    isClearPrefabs = isClearPrefabs || false;

    let createdDialogs = this.createdDialogs;
    let dialog = null;
    let dialogController = null;
    if (typeof (dialogRes) === 'object') { // if dialog component was passed
        dialog = dialogRes.node;
        dialogController = dialogRes;

        for (let key in createdDialogs) {
            if (createdDialogs.hasOwnProperty(key)) {
                if (createdDialogs[key] === dialog) {
                    dialogRes = key;
                    break;
                }
            }
        }
    } else { // if name of the dialog was passed
        dialog = createdDialogs[dialogRes] || null;

        let arr = dialogRes.split('/');
        let dialogType = arr[arr.length-1]; // name of the dialog component

		if(dialog) {
			dialogController = dialog.getComponent(dialogType);
		}
    }

    if(!dialog) {
        cc.warn(`Destroy dialog: ${dialogRes} doesn't exist`);
    } else {
        let dialogActionWidgetCtrl = dialog.getComponent("DialogActionWidgetCtrl");
        if (!!dialogActionWidgetCtrl) { // if dialog contains DialogActionWidgetCtrl
            dialogActionWidgetCtrl.dialogOut(function () {
                // TODO duplicate function, to refactor
                dialog.destroy(); // destroys the dialog node
                dialogController.isDestroy = true; // marks dialog component as destroyed

                delete createdDialogs[dialogRes];
                if (isClearPrefabs) { // release and remove prefab resource
                    cc.loader.releaseRes(dialogRes);
                    delete this.loadedDialogPrefabs[dialogRes];
                }
                cc.log(`Destroy dialog: ${dialogRes} destroyed`);
            }.bind(this))
        } else {
            // TODO duplicate function, to refactor
            dialog.destroy();
            dialogController.isDestroy = true;

            delete createdDialogs[dialogRes];
            if (isClearPrefabs){
                cc.loader.releaseRes(dialogRes);
                delete this.loadedDialogPrefabs[dialogRes];
            }

            cc.log(`Destroy dialog: ${dialogRes} destroyed`);
        }
    }
};


/**
 * Destoyes all dialogs, except dialogs with names passed in *exceptArr* array.
 * 
 * @param {string[]} exceptArr - names of the dialogs that won't be destroyed
 */
DialogManager.destroyAllDialog = function(exceptArr) {
    cc.log('DestroyAllDialog invoked');

    for (let key in this.createdDialogs){
        if (this.createdDialogs.hasOwnProperty(key)) {
            if (!!exceptArr && exceptArr.indexOf(key) >= 0) continue;

            let dialog = this.createdDialogs[key];
            dialog.destroy();
            let arr = key.split('/');
            let dialogType = arr[arr.length-1];
            dialog.getComponent(dialogType).isDestroy = true;
            delete this.createdDialogs[key];
        }
    }
};

/**
 * Shows loading circle dialog.
 * 
 * @param {number} delay - unused value
 */
DialogManager.addLoadingCircle = function (delay) {
    this.loadingCircleDialog.addLoadingCircle(delay);
};

/**
 * Stops loading circle dialog.
 */
DialogManager.removeLoadingCircle = function (){
    this.loadingCircleDialog.removeLoadingCircle();
};

/**
 * Creates popup dialog with specified *content* message and buttons.
 * 
 * @param {string} content - message of the popup dialog
 * @param {boolean} cbOK - whether OK button is present or not
 * @param {boolean} cbCancel - whether CANCEL button is present or not
 * @param {boolean} isRotate - unused
 */
DialogManager.addPopDialog = function(content, cbOK, cbCancel, isRotate ){
    this.popDialog.node.active = true;
    this.popDialog.addPopDialog(content, cbOK, cbCancel, isRotate);
};

/**
 * Create tip dialog with specified *content* message.
 * 
 * @param {string} content - message of the tip dialog 
 */
DialogManager.addTipDialog = function (content) {
    this.tipDialog.addTip(content);
};

module.exports = DialogManager;