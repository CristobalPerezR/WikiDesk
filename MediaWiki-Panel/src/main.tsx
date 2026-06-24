import { useState, useEffect, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import MinBox from './components/LittleWin/MinBox.tsx'
import Preferences from './components/Preferences/PrefWin.tsx'
import axiosConn from './config/axiosConnection.ts'
import { isAxiosError } from 'axios'

function Root() {
    const [currentHash, setCurrentHash] = useState(window.location.hash);
    const [connected, setConnected] = useState< "Desconectado" | "Conectado" | "Apagado" >("Apagado");

    useEffect(() => {
        const handleHashChange = () => {
        setCurrentHash(window.location.hash);
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        // console.log(connected)
        const tick = async() => {
            // console.log(connected != "Apagado", connected);
            if (connected != "Apagado"){
                try{
                    const result = await axiosConn.get("/TOOL_tick");

                    console.log(result);

                    if (result.data?.query?.userinfo?.anon === ""){
                        setConnected("Desconectado");
                        window.electron.setState({state: "Desconectado"});
                    } else{
                        setConnected("Conectado");
                        window.electron.setState({state: "Conectado"});
                    }

                } catch(e){
                    if (isAxiosError(e) && e.code === "ERR_NETWORK"){
                        // console.log("error catched")
                        setConnected("Apagado");
                        window.electron.setState({state: "Apagado"});
                    }
                }
            }
        }
        const interval = setInterval(tick, 5 * 60 * 1000); // 5 minutos 
        // const interval = setInterval(tick, 500000); // test 5 segundos

        return () => clearInterval(interval);
    }, [connected]);

    useEffect(() => {
        window.electron.onStateChanged((cfg) => {
            
            if (cfg){
                setConnected(cfg.state);
            }
        });
        return () => {
            window.electron.removeStateListener();
        }
    });

    const updateConection = async(info: "Desconectado" | "Conectado" | "Apagado") => {
        setConnected(info);
        window.electron.setState({state: info});
    }


    // PAGES
    if (currentHash === '#/minbox') {
        return <MinBox />;
    }
    if (currentHash === '#/preferences'){
        return <Preferences />
    }

    return <App state={connected} updateState={(info) => {updateConection(info)}}/>;
}


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Root />
    </StrictMode>,
)