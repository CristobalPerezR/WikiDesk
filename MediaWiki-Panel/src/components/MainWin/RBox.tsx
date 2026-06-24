import { useEffect, useState } from "react";
import Disconected from "../../assets/connecting.svg?react";
import Connected from "../../assets/connected.svg?react"
import Api from "../../assets/api.svg?react"
import "./rbox.css"
import axiosConn from "../../config/axiosConnection";

interface prop{
    state: string,
    onWork: () => void,
    onFinish: () => void,
    updateState: (info: "Desconectado" | "Conectado" | "Apagado") => void
}

const RBox = ( { state, onWork, onFinish, updateState }:prop ) => {
    const [loged, setLoged] = useState< boolean | null >(null);
    const [outed, setOuted] = useState< boolean | null >(null);

    useEffect(() => {
        const text = document.getElementById("statusText") as HTMLElement;

        if (state === "Conectado"){
            text.className = "state-connected";
        } else if (state === "Desconectado"){
            text.className = "state-disconnected";
        } else {
            text.className = "state-down";
        }

    }, [state]);

    const handle_turn_on = async() => {
        onWork();
        try{
            const result = await window.electron.TurnOnApi();
            if (result.success){
                updateState("Desconectado");
                window.electron.setState({state: "Desconectado"});
            }
            onFinish();
        } catch(e){
            onFinish();
        }
    };

    const handle_login = async() => {
        onWork();
        try{
            const result = await axiosConn.post("/login");
            console.log(result.data);

            if (result.data.login?.login?.result === "Success"){
                updateState("Conectado");
                window.electron.setState({state: "Conectado"});
                setLoged(true);

                setTimeout(() => {
                    setLoged(null);
                }, 500);

                if (result.data.memory?.id) {
                    window.electron.setConfig(result.data.memory)
                }
            }
            if (result.data.login?.login?.result === "Failed"){
                setLoged(false);

                setTimeout(() => {
                    setLoged(null);
                }, 500);
            }

            onFinish();
            
        } catch(e){
            onFinish();

            setLoged(false);
            setTimeout(() => {
                setLoged(null);
            }, 500);

            console.log("Rbox -> handle_login: ", e);
        }
    };

    const handle_logout = async() => {
        onWork();
        try{
            const result = await axiosConn.post("/logout");
            if (result.status === 200){
                setOuted(true);
                setTimeout(() => {
                    setOuted(null);
                }, 500);
                updateState("Desconectado");
                window.electron.setState({state: "Desconectado"});
            }
            onFinish();
        } catch(e){
            onFinish();

            setOuted(false);
            setTimeout(() => {
                setOuted(null);
            }, 500);

            console.log("Rbox -> handle_logout: ", e);
        }
    };

    return(
        <div className="box">

            <div className="title">
                Estado
            </div>

            <div className="status">
                <div>
                    {state === "Desconectado" && <Disconected className="c1"/>}
                    {state === "Conectado" && <Connected className="c2"/>}
                    {state === "Apagado" && <Api className="c3"/>}
                </div>
                <div>
                    <span id="statusText">{state}</span>
                </div>
            </div>
            <div className="box-buttons">
                <button className={`${loged === null? "" : loged? "done" : "failure"}`} onClick={handle_login} disabled={(state != "Desconectado")}>Login</button>
                <button className={`${outed === null? "" : outed? "done" : "failure"}`} onClick={handle_logout} disabled={(state != "Conectado")}>Logout</button>
            </div>
            <button onClick={handle_turn_on} disabled={state != "Apagado"}> Turn On </button>

        </div>
    )
}

export default RBox;