declare const enum HotUpdateState {
    STATE_UP_TO_DATE,
    STATE_ERROR,
    STATE_CHECKING,
    STATE_UPDATING,
    STATE_WAIT_REBOOT,
}

declare class HotUpdate {
    get state(): HotUpdateState;

    get assetsManager(): any;

    get numBytesDownloaded(): number;

    get numBytesTotal(): number;

    get numFilesDownloaded(): number;

    get numFilesTotal(): number;

    do(): void;

    retry(): void;

    reboot(): void;
}

declare const hotUpdate: HotUpdate;