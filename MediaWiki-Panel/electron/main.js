import { app, BrowserWindow, ipcMain, Menu, screen, shell } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "url";
import fs from "fs";
import kill from "tree-kill";

import { watcher } from "./listener.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const __userData = path.join(app.getPath("userData"), "Config");

let on_front;

let MainWin;
let LittleWin;
let ModalWin;

let minimize = false;
let backend = null;

function createWindow() {
    MainWin = new BrowserWindow({
        width: 752,
        height: 257,
        minWidth: 0,
        minHeight: 0,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        },
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
    });

    LittleWin = new BrowserWindow({
        width: 200,
        height: 74,
        minWidth: 0,
        minHeight: 0,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        },
        frame: false,
        show: false,
        transparent: true,
        backgroundColor: '#00000000',
    });

    ModalWin = new BrowserWindow({
        parent: MainWin,
        modal: true,
        width: 600,
        height: 434,
        minWidth: 0,
        minHeight: 0,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        },
        frame: false,
        show: false,
        transparent: true,
        backgroundColor: '#00000000',
    });


    MainWin.webContents.on("did-finish-load", () => {
        console.log("HTML cargado");
    });

    MainWin.webContents.on("did-fail-load", (_, code, desc) => {
        console.log("FAIL LOAD:", code, desc);
    });

    MainWin.webContents.on("render-process-gone", (_, details) => {
        console.log("RENDER CRASH", details);
    });

    MainWin.webContents.on("console-message", (_, level, msg) => {
        console.log("RENDER LOG:", msg);
    });


    layout(MainWin, LittleWin);

    //#region Main/Little Window
    ipcMain.on("close-window", async() => {
        appClose();
    });

    ipcMain.on("redux-window", () =>{
        if (minimize){
            MainWin.hide();
            LittleWin.showInactive();
            LittleWin.moveTop();
        } else{
            MainWin.minimize();
        }
    });

    ipcMain.on("restore-window", () =>{
        if (!MainWin.isMinimized()){
            LittleWin.hide();
            MainWin.show();
            MainWin.moveTop();
        } else {
            MainWin.restore();
        }
    });

    ipcMain.on("update-config", async() => {
        const data = await watcher();
        if (data.DONE){
            on_front = data.ON_FRONT;
            minimize = data.ON_MINIMIZE;
        }
        layout(MainWin, LittleWin);
    });

    ipcMain.handle("turn-on-api", async() => {
        try{
            const on = await startApi();
            const data = await watcher();
            if (data.DONE){
                console.log(data);
                on_front = data.ON_FRONT;
                minimize = data.ON_MINIMIZE;
            }
            return on;
        } catch (e){
            console.log("turn-api-on: ", e);
            return {
                success: false
            };
        }
    });
    
    // OPEN HANDLERS
    ipcMain.on("open-web-page", (_,url) =>{
        shell.openExternal(url);
    });

    // INFO CHANGE HANDLERS
    ipcMain.handle("config:get", () => {
        const win = BrowserWindow.getAllWindows()[0];
        return win.webContents.executeJavaScript(`
            localStorage.getItem("page")
        `);
    });

    ipcMain.handle("config:set", async (_, data) => {
        const windows = BrowserWindow.getAllWindows();

        const payload = JSON.stringify(data);

        for  (const win of windows){
            await win.webContents.executeJavaScript(`
                localStorage.setItem("page", '${payload}')
            `);

            win.webContents.send("config:changed", JSON.parse(payload));
        }
    });

    //STATE CHANGE HANDLERS
    ipcMain.handle("state:get", () => {
        const win = BrowserWindow.getAllWindows()[0];
        return win.webContents.executeJavaScript(`
            localStorage.getItem("status")
        `);
    });

    ipcMain.handle("state:set", async(_, data) => {
        const windows = BrowserWindow.getAllWindows();

        const payload = JSON.stringify(data);

        for (const win of windows){
            await win.webContents.executeJavaScript(`
                localStorage.setItem("status", '${payload}')
            `);
            win.webContents.send("state:changed", JSON.parse(payload));
        }
    });

    //#endregion

    //#region modal - Preferences
    ipcMain.on("openmodal", () => {
        ModalWin.show();
    });

    ipcMain.on("closemodal", () => {
        ModalWin.hide();
    });
    //#endregion

    if (!app.isPackaged) {
        MainWin.loadURL("http://localhost:7070");
        LittleWin.loadURL("http://localhost:7070/#/minbox");
        ModalWin.loadURL("http://localhost:7070/#/preferences");
        // ModalWin.webContents.openDevTools({mode: "detach"});

    } else {
        const indexPath = path.join(__dirname, "..", "dist", "index.html");
        // console.log({
        //     "dirname": __dirname,
        //     "indexpath": indexPath,
        //     "exist?": fs.existsSync(indexPath),
        //     "dir_exist": fs.existsSync(__dirname)
        // });
        MainWin.loadFile(indexPath);
        LittleWin.loadFile(indexPath, { hash: "/minbox" });
        ModalWin.loadFile(indexPath, { hash: "/preferences" });
    }
};

//#region BACKEND turn-on
function startApi(){
    return new Promise( async (resolve, reject) => {
        if (backend){
            await new Promise((resolve) => {
                kill(backend.pid, "SIGTERM", resolve);
            });
        }

        let cmd, args, cwdOpts;


        if(!app.isPackaged){
            cmd = "pnpm";
            args = ["run", "dev"];
            cwdOpts = path.resolve(__dirname, "../../Api-Bot");
            console.log("PATH: ", path.resolve(__dirname, "../../Api-Bot"))
        } else {
            cmd = "node";
            args = ["index.js"]; // Asume que tu compilado en Api-Bot/dist genera un index.js en la raiz del extraResource
            cwdOpts = path.join(process.resourcesPath, "api");
        }

        backend = spawn(cmd, args, {
            cwd: cwdOpts,
            stdio: ["ignore", "pipe", "pipe"],
            shell: true,
            env:{
                ...process.env,
                CONFIG_DIR: __userData
            }
        });

        let exito = false;

        backend.stdout.on("data", (data) => {
            const text = data.toString();

            console.log(`[BACKEND-LOG]: ${text}`);

            if (text.includes("ON") && !exito) {
                exito = true;
                console.log("¡Backend detectado listo!");
                resolve({ success: true });
            }
        });

        backend.stderr.on("data", (data) => {
            console.error("[BACKEND STDERR]", data.toString());
        });

        // WATCHER
        backend.once("exit", async code => {
            console.log(`El backend se detuvo. Codigo: ${code}`);

            if (!exito){
                resolve({ success: false, reason: `Backend termino con codigo ${code}` });
            } else{
                const payload = JSON.stringify({state: "Apagado"});
                const windows = BrowserWindow.getAllWindows();

                for (const win of windows){
                    if (!win.isDestroyed() && win.webContents) {
                        await win.webContents.executeJavaScript(`
                            localStorage.setItem("status", '${payload}')
                        `).catch(() => {});
                        win.webContents.send("state:changed", JSON.parse(payload));
                    }
                }
            }
        });

        // ERROR HANDLER
        backend.once("error", (err) => {
            if (!exito){
                console.log("err: ", err.message)
                resolve({ success: false, reason: err.message });
            }
        });
    });
};

async function initApi(){
    const res = await startApi();
    
    if (res && res.success) {
        console.log(`Backend inicado: ${res.success}`)
        const payload = JSON.stringify({state: "Desconectado"});
        const windows = BrowserWindow.getAllWindows();

        for (const win of windows){
            if (!win.isDestroyed() && win.webContents) {
                await win.webContents.executeJavaScript(`
                    localStorage.setItem("status", '${payload}')
                `).catch(() => {});
                win.webContents.send("state:changed", JSON.parse(payload));
            }
        }
    } else{
        console.log("El backend no pudo inicializar:", res.reason);
        
        const payload = JSON.stringify({state: "Apagado"});
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows){
            if (!win.isDestroyed() && win.webContents) {
                await win.webContents.executeJavaScript(`
                    localStorage.setItem("status", '${payload}')
                `).catch(() => {});
                win.webContents.send("state:changed", JSON.parse(payload));
            }
        }
    }
};

//#endregion

function registerScreenListeners() {
    screen.on("work-area-changed", () => {
        if (MainWin && LittleWin && !MainWin.isDestroyed() && !LittleWin.isDestroyed()) {
            layout(MainWin, LittleWin);
        }
    });

    screen.on("display-metrics-changed", () => {
        if (MainWin && LittleWin && !MainWin.isDestroyed() && !LittleWin.isDestroyed()) {
            layout(MainWin, LittleWin);
        }
    });
};

function layout(main, small, front=on_front) {
    if (!main || main.isDestroyed() || !small || small.isDestroyed()) return;

    const display = screen.getDisplayMatching(main.getBounds());
    const wa = display.workArea;

    const xsmall = 200;
    const ysmall = 74;

    const xmain = 752;
    const ymain = 257;

    small.setBounds({
        x: wa.x + wa.width - xsmall - 5,
        y: wa.y + wa.height - ysmall - 5,
        width: xsmall,
        height: ysmall
    });
    small.setAlwaysOnTop(front);

    main.setBounds({
        x: wa.x + (wa.width - xmain) / 2,
        y: wa.y + (wa.height - ymain) / 2,
        width: xmain,
        height: ymain
    });
};

function initUserStorage(){
    if (!fs.existsSync(__userData)){
        fs.mkdirSync(__userData, {recursive: true});
    }

    const connPath = path.join(__userData, "conn.json");
    const savePath = path.join(__userData, "saved_memory.json");
    const userPath = path.join(__userData, "user_config.json");

    function ensureFile(filePath, defaultData){
        if(!fs.existsSync(filePath)){
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 4));
        }
    }

    ensureFile(connPath, {
        "API_URL":"",
        "USERNAME":"",
        "PASSWORD":""
    });
    ensureFile(savePath, {
        "PAGE_ID": null,
        "PAGE_NAME": null
    });
    ensureFile(userPath, {
        "SAVE_IN": "",
        "AUTO_APPROVE": false,
        "ON_MINIMIZE": false,
        "MIN_FRONT": false,
        "SECURE_PAGE": false
    });
}

async function appClose(){
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows){
        if (!win.isDestroyed() && win.webContents) {
            await win.webContents.executeJavaScript(`
                localStorage.removeItem("page");
                localStorage.removeItem("status");
            `).catch(() => {});
        }
    };

    if (backend && !backend.killed) {
        // Mata el backend y todos sus hijos
        kill(backend.pid, 'SIGTERM', (err) => {
            if (err) console.error('Error al matar backend:', err);
            app.quit();
        });
    } else {
        app.quit();
    }
}

Menu.setApplicationMenu(null);

app.whenReady().then(async() => {
    // console.log("A");
    initUserStorage();
    // console.log("B");
    createWindow();
    // console.log("C");
    await initApi();
    // console.log("D");
    const data = await watcher();
    if (data.DONE){
        on_front = data.ON_FRONT;
        minimize = data.ON_MINIMIZE;
        layout(MainWin, LittleWin)
    };
    // console.log("E");
    registerScreenListeners();
    // console.log("F");
});

process.on('SIGINT', appClose);
process.on('SIGTERM', appClose);
process.on('exit', () => {
    if (backend && !backend.killed) {
        kill(backend.pid, 'SIGKILL');
    }
});

app.on("window-all-closed", () => {
    appClose();
});