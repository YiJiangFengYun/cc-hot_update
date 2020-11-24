(function () {
    
    const STATE_UP_TO_DATE = 0;
    const STATE_ERROR = 1;
    const STATE_CHECKING = 2;
    const STATE_UPDATING = 3;
    const STATE_WAIT_REBOOT = 4;

    window.HotUpdateState = {
        STATE_UP_TO_DATE,
        STATE_ERROR,
        STATE_CHECKING,
        STATE_UPDATING,
        STATE_WAIT_REBOOT,
    }
    
    function createHotUpdate(options) {

        function _logInfo(...args) {
            console.info('Hot Update', ...args);
        }

        function _logError(...args) {
            console.error('Hot Update', ...args);
        }

        var _auto = options && options.auto !== undefined ? Boolean(options.auto) : true;
        var _state = 0;
        var _errorUpdateAsset = false;
        // var _cbProgress = null;
        var _numBytesDownloaded = 0;
        var _numBytesTotal = 0;
        var _numFilesDownloaded = 0;
        var _numFilesTotal = 0;

        const _storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remote-asset');
        _logInfo('Storage path for remote asset : ' + _storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        function _versionCompareHandle(versionA, versionB) {
            _logInfo('JS Custom Version Compare: version A is ' + versionA + ', version B is ' + versionB);
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
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
        };

        //Verification function for checking whether downloaded asset is correct
        function _verifyFileDownloaded(path, infoAsset) {
            return true;
        }

        function _onEvents(event) {
            _logInfo('Hot Update Event: code ' + event.getEventCode());
            switch (event.getEventCode())
            {
                case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                    _logError('No local manifest file found ! ');
                    _state = STATE_ERROR;
                    _errorUpdateAsset = false;
                    break;
                case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                    _logError('Failed to download manifest file ! ');
                    _state = STATE_ERROR;
                    _errorUpdateAsset = false;
                    break;
                case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                    _logInfo('Up to date!');
                    _state = STATE_UP_TO_DATE;
                    break;
                case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                    _doUpdate();
                    break;
                case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                    // if (_cbProgress) _cbProgress(
                    //     event.getDownloadedBytes(), 
                    //     event.getTotalBytes(), 
                    //     event.getDownloadedFiles(), 
                    //     event.getTotalFiles()
                    // );
                    _numBytesDownloaded = event.getDownloadedBytes();
                    _numBytesTotal = event.getTotalBytes();
                    _numFilesDownloaded = event.getDownloadedFiles();
                    _numFilesTotal = event.getTotalFiles();
                    break;
                case jsb.EventAssetsManager.UPDATE_FINISHED:
                    _logInfo('Succeeded to hot update!')
                    _state = STATE_WAIT_REBOOT;
                    break;
                case jsb.EventAssetsManager.UPDATE_FAILED:
                    _logError('Failed to update! ' + event.getMessage());
                    _state = STATE_ERROR;
                    break;
                case jsb.EventAssetsManager.ERROR_UPDATING:
                    _logError('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage())
                    _errorUpdateAsset = true;
                    break;
                case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                    _logError('Decompress error: ' + event.getMessage());
                    break;
                default:
                    return;
            }
        }

        const _am = new jsb.AssetsManager('./res/project.manifest', _storagePath, _versionCompareHandle);

        _am.setVerifyCallback(_verifyFileDownloaded);
        _am.setEventCallback(_onEvents);

        // if (cc.sys.os === cc.sys.OS_ANDROID) {
        //     // Some Android device may slow down the download process when concurrent tasks is too much.
        //     // The value may not be accurate, please do more test and find what's most suitable for your game.
        //     _am.setMaxConcurrentTask(2);
        //     console.info('Max concurrent tasks count have been limited to 2');
        // }

        function _doCheck() {
            _state = STATE_CHECKING;
            _am.checkUpdate();
        }

        function _doUpdate() {
            _state = STATE_UPDATING;
            _numBytesDownloaded = 0;
            _numBytesTotal = 0;
            _numFilesDownloaded = 0;
            _numFilesTotal = 0;
            _am.update();
        }

        function _reboot() {
            cc.audioEngine.stopAll();
            cc.game.restart();
        }

        function _do() {
            console.info('Checking or updating ...');
            _doCheck();
        }

        function _retry() {
            if (_state !== STATE_ERROR) return;
            if (_errorUpdateAsset)
                _am.downloadFailedAssets();
            else _do();
        }

        if (_auto) {
            _do();
        }

        return {
            get state() {
                return _state;
            },

            get assetsManager() {
                return _am;
            },

            get numBytesDownloaded() {
                return _numBytesDownloaded;
            },

            get numBytesTotal() {
                return _numBytesTotal;
            },

            get numFilesDownloaded() {
                return _numFilesDownloaded;
            },

            get numFilesTotal() {
                return _numFilesTotal;
            },
            
            // setProgressCallback(cb) {
            //     _cbProgress = cb;
            // },

            do() {
                _do();
            },

            retry() {
                _retry();
            },

            reboot() {
                _reboot();
            },
        }
    }

    window.hotUpdate = createHotUpdate();
})();