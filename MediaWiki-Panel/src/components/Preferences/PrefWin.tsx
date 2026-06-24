import { X } from "react-bootstrap-icons";
import axios from "axios";
import "./prefwin.css"
import { useEffect, useRef, useState } from "react";
import axiosConn from "../../config/axiosConnection";

const Preferences = ( ) => {
    const [conected, setConected] = useState<boolean | null>(null);
    const [state, setState] = useState("Apagado");
    const [aux, setAux] = useState(false);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [apiurl, setApiUrl] = useState("");

    const [path, setPath] = useState("");
    const [autoapprove, setAutoApprove] = useState(false);
    const [onminimize, setOnMinimize] = useState(false);
    const [minfront, setMinFront] = useState(false);
    const [securepage, setSecurePage] = useState(false);

    const OLD_username = useRef(null);
    const OLD_password = useRef(null);
    const OLD_apiurl = useRef(null);

    const OLD_path = useRef(null);
    const OLD_autoapprove = useRef(null);
    const OLD_onminimize = useRef(null);
    const OLD_minfront = useRef(null);
    const OLD_securepage = useRef(null);

    useEffect(()=> {
        const getconfig = async() => {
            try{
                const config = await axiosConn.get("/INTERNAL_GetConfig");

                const user = config.data.user_conf;
                const conn = config.data.conn_conf;

                OLD_username.current = conn.USERNAME;
                OLD_password.current = conn.PASSWORD;
                OLD_apiurl.current = conn.API_URL;

                OLD_path.current = user.SAVE_IN;
                OLD_autoapprove.current = user.AUTO_APPROVE;
                OLD_onminimize.current = user.ON_MINIMIZE;
                OLD_minfront.current = user.MIN_FRONT;
                OLD_securepage.current = user.SECURE_PAGE;

                setUsername(conn.USERNAME);
                setPassword(conn.PASSWORD);
                setApiUrl(conn.API_URL);

                setPath(user.SAVE_IN);
                setAutoApprove(user.AUTO_APPROVE);
                setOnMinimize(user.ON_MINIMIZE);
                setMinFront(user.MIN_FRONT);
                setSecurePage(user.SECURE_PAGE);

            } catch(e){
                console.log("PrefWin: ", e);
            }
        }

        if (state != "Apagado"){getconfig()}
    }, [state, aux]);

    
    const save_user = async() => {
        const result = await axiosConn.post("/INTERNAL_UpdateUser", {
            savein: path, 
            autoapprove: autoapprove, 
            onminimize: onminimize, 
            minfront: minfront, 
            securepage: securepage
        });

        if (result.status === 200){
            console.log("Success: ", result.status)
        } else{
            console.log("Something went Wrong on PrefWin -> save_user: ", result.status)
        }
    };

    const save_conn = async() => {
        const result = await axiosConn.post("/INTERNAL_UpdateConn", {
            api_url: apiurl, 
            username: username, 
            password: password
        });

        if (result.status === 200){
            console.log("Success: ", result.status)
        } else{
            console.log("Something went Wrong on PrefWin -> save_conn: ", result.status)
        }
    };

    const handle_close = () => {
        try {
            let update = false;

            if (password != OLD_password.current || username != OLD_username.current || apiurl != OLD_apiurl.current ) {
                save_conn();
                update = true;
            }

            if (path != OLD_path.current || autoapprove != OLD_autoapprove.current || onminimize != OLD_onminimize.current ||
            minfront != OLD_minfront.current || securepage != OLD_securepage.current){
                save_user();
                update = true;
            }

            if (state === "Apagado"){update = false};

            if (update) {
                window.electron.updateConfig();
                setAux(!aux);
            }

            window.electron.CloseModal();
        } catch(e){
            console.log("PrefWin -> handle_close", e);
        }
    };

    const handle_try = async() => {
        try{
            const result = await axiosConn.post("/INTERNAL_TestConnection", {
                "test_url": apiurl
            });
            
            setConected(result.status === 200);

        } catch(e){
            if( axios.isAxiosError(e)){
                if (e.response?.status === 404) {
                    setConected(false);
                } else {
                    setConected(null);
                }
            }
            console.log("PrefWin -> handle_try", e);
        }
    };

    useEffect(() => {
        window.electron.onStateChanged((cfg) => {
            if (cfg){
                setState(cfg.state);
            }
        });
        return () => {
            window.electron.removeStateListener();
        }
    }, []);

    return(
        <div className={`modal`}>
            <header className="modalFrame">
                <div className="modal-buttons close no-drag" onClick={handle_close}>
                    <X size={20}></X>
                </div>
            </header>
            <main className={`modalbody ${state != "Apagado" ? "" : "disabled"}`}>
                <div className="Account">
                    <div>
                        <span>Configuración de Conexión</span>
                    </div>
                    <div>
                        <div className="spans">
                            <span>Username</span>
                            <span>Password</span>
                            <span>Api-URL</span>
                        </div>
                        <div className="inputs">
                            <input type="text" value={username} placeholder="nombre bot" onChange={(e) => {setUsername(e.target.value)}}/>
                            <input type="text" value={password} placeholder="contraseña bot" onChange={(e) => {setPassword(e.target.value)}}/>
                            <input className={`${conected === null ? "" : conected ? "done" : "failure"}`} type="text" value={apiurl} placeholder="https://wiki.org/w/api.php" onChange={(e) => {setApiUrl(e.target.value)}}/>
                        </div>
                        <div className="relleno">
                            <button></button>
                            <button></button>
                            <button onClick={handle_try}> Try </button>
                        </div>
                    </div>
                </div>
                <div className="Pref">
                    <div>
                        <span>Preferencias</span>
                    </div>
                    <div>
                        <div className="spansP">
                            <span>minimizar?</span>
                            <span>guardar id?</span>
                            <span>bloquear?</span>
                            <span>AutoApprove?</span>
                        </div>
                        <div className="checks">
                            <input type="checkbox" checked={!onminimize} onChange={() => {setOnMinimize(!onminimize)}}/>
                            <input type="checkbox" checked={securepage} onChange={() => {setSecurePage(!securepage)}}/>
                            <input type="checkbox" checked={minfront} onChange={() => {setMinFront(!minfront)}}/>
                            <input type="checkbox" checked={autoapprove} onChange={() => {setAutoApprove(!autoapprove)}}/>
                        </div>
                        <div className="notas">
                            <span>desactivar para que al minimizar se quede un panel en pantalla.</span>
                            <span>activar para mantener la informacion en caso de perdida de conexion.</span>
                            <span>solo sirve con minimizar inactivo, mantiene el panel siempre visible.</span>
                            <span>aprueva automaticamente cada revision.</span>
                        </div>
                    </div>
                </div>
                <div className="Save">
                    <div>
                        <span>Guardado</span>
                    </div>
                    <div>
                        <div className="spanS">
                            <span>Path</span>
                        </div>
                        <div className="path">
                            <input type="text" placeholder="Obligatorio para Pull de wikitext" value={path} onChange={(e) => {setPath(e.target.value)}}/>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Preferences;