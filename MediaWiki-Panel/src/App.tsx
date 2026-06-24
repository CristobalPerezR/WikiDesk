import { useEffect, useState } from 'react';
import './App.css'
import './dialog.css'
import Frame from "./components/Frame/Frame";
import LBox from "./components/MainWin/LBox";
import RBox from "./components/MainWin/RBox";

interface prop {
    state: string,
    updateState: (info: "Desconectado" | "Conectado" | "Apagado")=> void
}

function App( { state, updateState }: prop) {
    const [pagename, setPageName] = useState("None");
    const [pageid, setPageId] = useState<number | "id">("id");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // console.log("MOUNT LISTENER");

        window.electron.onConfigChanged((cfg) => {
            // console.log("EVENT IPC:", cfg);

            if (cfg) {
                setPageId(parseInt(cfg.id));
                setPageName(cfg.title);
            }
        });

        return () => {
            // console.log("UNMOUNT LISTENER");
            window.electron.removeConfigListener();
        };
    }, []);

    return (
        <main className='mainapp'>
            <Frame />
            <div className="wrapper">
                <div className="panel">
                    <LBox state={state} pageid={pageid} onWork={() => {setLoading(true)}} onFinish={() => {setLoading(false)}}/>
                    <RBox state={state} onWork={() => {setLoading(true)}} onFinish={() => {setLoading(false)}} updateState={(info) => {updateState(info)}}/>
                </div>
                <div className='foot_info'>
                    <span>Active Page: {pagename} | {pageid}</span>
                </div>
            </div>

            {loading &&
                <dialog className='loading' open={loading}>
                    <div>
                        <span />
                    </div>
                </dialog>
            }
        </main>
    )
};

export default App;