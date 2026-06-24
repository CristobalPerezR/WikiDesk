import Disconected from "../../assets/connecting.svg?react";
import Connected from "../../assets/connected.svg?react"
import Api from "../../assets/api.svg?react"
import { BoxArrowInUpLeft } from "react-bootstrap-icons";
import "./minbox.css"
import { useEffect, useState } from "react";

const MinBox = ( ) =>{
    const [pageid, setPageId] = useState<number | "id">("id");
    const [state, setState] = useState("Apagado");

    useEffect(() => {
        const text = document.getElementById("statusText") as HTMLElement;

        if (state === "Conectado"){
            text.className = "state-connected";
        } else if (state === "Desconectado"){
            text.className = "state-disconnected";
        } else {
            text.className = "state-down";
        }

        console.log("state: ", state);

    }, [state]);

    useEffect(() => {
        // console.log("MOUNT LISTENER");
        window.electron.onConfigChanged((cfg) => {
            // console.log("EVENT IPC:", cfg);

            if (cfg) {
                setPageId(cfg.id as number);
            }
        });

        return () => {
            // console.log("UNMOUNT LISTENER");
            window.electron.removeConfigListener();
        };
    });

    useEffect(() => {
        window.electron.onStateChanged((cfg) => {
            console.log("MinBox: ", cfg);
            
            if (cfg){
                setState(cfg.state);
            }
        });
        return () => {
            window.electron.removeStateListener();
        }
    });
    
    return (
        <main className="mainapp">
            <div className="mini-panel">
                {/* Derecha */}
                <div>
                    <div className="mini-status">
                        {state === "Desconectado" && <Disconected className="c1"/>}
                        {state === "Conectado" && <Connected className="c2"/>}
                        {state === "Apagado" && <Api className="c3"/>}
                        <span id="statusText"> {state} </span>
                    </div>
                    <div>
                        <span>Active id: {pageid}</span>
                    </div>
                </div>

                {/* Izquierda */}
                <div>
                    <div onClick={() => window.electron.restoreWindow()}>
                        <BoxArrowInUpLeft size={20}></BoxArrowInUpLeft>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default MinBox;