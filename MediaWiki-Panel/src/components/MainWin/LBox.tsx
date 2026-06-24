import { useState } from "react";
import axiosConn from "../../config/axiosConnection";

interface prop {
    state: string,
    pageid: string | number,
    onWork: () => void,
    onFinish: () => void
}

const LBox = ( { state, pageid, onWork, onFinish }:prop ) => {
    const [done, setDone] = useState< boolean | null>(null);
    const [pushed, setPushed] = useState< boolean | null >(null);
    
    const [pullname, setPullName] = useState("");
    const [commit, setCommit] = useState("");

    const handle_pull = async() =>{
        onWork();
        try{
            const result = await axiosConn.post("/pull_page", {
                title: pullname
            });

            if (result.status === 200){
                if (result.data?.id != -1){
                    setDone(true);

                    setTimeout(() => {
                        setDone(null);
                    }, 500);

                    window.electron.setConfig(result.data);

                } else{
                    setDone(false);
                }
            }
            onFinish();

        } catch(e){
            onFinish();
            setDone(false);
            console.log("LBox.tsx -> handle_pull", e);
        }
    };

    const handle_push = async() =>{
        onWork();
        try{
            const result = await axiosConn.post("/push_page", {
                summary: commit
            })
            if (result.status === 200){
                setPushed(true);

                setTimeout(() => {
                    setPushed(null);
                }, 500);

                setCommit("");
            }
            onFinish();
        } catch(e){
            onFinish();
            setPushed(false);
            console.log("LBox.tsx -> handle_push", e);
        }

    };

    return(
        <div className="box">

            <div className="title">
                MediaWiki API
            </div>

            <input className={`${done === null ? "" : done? "done" : "failure"}`} onSubmit={handle_pull} id="pageName" placeholder="Página" type="text" onChange={(e) => {setPullName(e.target.value)}} disabled={state != "Conectado"}/>
            
            <input className={`${pushed === null ? "" : pushed? "done" : "failure"}`}  onSubmit={handle_push} id="commitMsg" placeholder="Commit / descripción" type="text" onChange={(e) => {setCommit(e.target.value)}} disabled={state != "Conectado" || (typeof pageid != typeof 0)}/>

            <div className="row">
                <button onClick={handle_pull} disabled={(state != "Conectado")}>Pull</button>
                <button onClick={handle_push} disabled={(state != "Conectado") || (typeof pageid != typeof 0)}>Push</button>
            </div>

        </div>
    )
}

export default LBox;