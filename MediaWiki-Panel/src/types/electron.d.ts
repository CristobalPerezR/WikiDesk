export {};

declare global {
    interface Window {
        electron: {
        closeWindow: () => void;
        reduxWindow: () => void;
        minimizeWindow: () => void;
        restoreWindow: () => void;
        updateConfig: () => void;
        OpenModal: () => void;
        CloseModal: () => void;

        openWebPage: (url: string) => void;

        TurnOnApi: () => Promise<any>;

        getConfig: () => Promise<any>;
        setConfig: (data: any) => Promise<any>;
        onConfigChanged: (cb: (data: any) => void) => void;
        removeConfigListener: () => void;

        getState: () => Promise<any>;
        setState: (data: any) => Promise<any>;
        onStateChanged: (cb: (data: any) => void ) => void;
        removeStateListener: () => void;
        };
    }
}