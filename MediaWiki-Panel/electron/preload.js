const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    closeWindow: () => ipcRenderer.send("close-window"),
    reduxWindow: () => ipcRenderer.send("redux-window"),
    minimizeWindow: () => ipcRenderer.send("minimize-window"),
    restoreWindow: () => ipcRenderer.send("restore-window"),
    updateConfig: () => ipcRenderer.send("update-config"),

    openWebPage: (url) => ipcRenderer.send("open-web-page", url),

    // API LOAD
    TurnOnApi: () => ipcRenderer.invoke("turn-on-api"),

    //PREFERENCES
    OpenModal: () => ipcRenderer.send("openmodal"),
    CloseModal: () => ipcRenderer.send("closemodal"),

    // CONFIG (request/response)
    getConfig: () => ipcRenderer.invoke("config:get"),
    setConfig: (data) => ipcRenderer.invoke("config:set", data),
    onConfigChanged: (cb) => {
        ipcRenderer.on("config:changed", (_, data) => cb(data));
    },
    removeConfigListener: () => {
        ipcRenderer.removeAllListeners("config:changed");
    },


    // STATUS (request/response)
    getState: () => ipcRenderer.invoke("state:get"),
    setState: (data) => ipcRenderer.invoke("state:set", data),

    onStateChanged : (cb) => {
        ipcRenderer.on("state:changed", (_, data) => cb(data));
    },
    removeStateListener: () =>{
        ipcRenderer.removeAllListeners("state:changed");
    }
});