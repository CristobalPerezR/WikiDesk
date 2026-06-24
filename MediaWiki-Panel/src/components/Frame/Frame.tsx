import './frame.css'
import './menues.css'
import logoIMG from "../../assets/MediaWiki.png"
import ConnIMG from "../../assets/connect.svg?react"
import { X, Dash } from "react-bootstrap-icons";
import { useEffect, useState } from 'react';

const Frame = () => {
    const [focusmenu, setFocusMenu] = useState("");

    const toggler = (focus: string) => {
        setFocusMenu(current =>
            current === focus ? "" : focus
        );
    };

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (
                target.closest('.frame-menu') ||
                target.closest('.menus')
            ) {
                return;
            }

            setFocusMenu("");
        };

        document.addEventListener("pointerdown", handleClick);

        return () => {
            document.removeEventListener("pointerdown", handleClick);
        };
    }, []);

    return(
        <>
            <header className="frame">
                <div className="menubar">
                    <div>
                        <img className="logo" src={logoIMG} />
                        <ConnIMG />
                    </div>
                    <div className={`menus no-drag ${focusmenu === "file" ? "on" : ""}`} onClick={() => {toggler("file")}}>
                        <span>File</span>
                    </div>
                    <div className={`menus no-drag ${focusmenu === "help" ? "on" : ""}`} onClick={() => {toggler("help")}}>
                        <span>Help</span>
                    </div>
                </div>
                <div className="winbar">
                    <div className="win-buttons min no-drag" onClick={() => window.electron.reduxWindow()}>
                        <Dash size={20}></Dash>
                    </div>
                    <div className="win-buttons close no-drag" onClick={() => window.electron.closeWindow()}>
                        <X size={25}></X>
                    </div>
                </div>
            </header>

            <div className={`frame-menu file ${focusmenu === "file" ? "" : "off"}`}>
                <span onClick={() => window.electron.OpenModal()}>Preferencias</span>
                <span onClick={() => window.electron.closeWindow()}>Salir</span>
            </div>
            
            <div className={`frame-menu help ${focusmenu === "help" ? "" : "off"}`}>
                <span onClick={() => {window.electron.openWebPage("https://github.com/CristobalPerezR/WikiDesk/blob/main/README.md")}}>Documentation</span>
                <span onClick={() => {window.electron.openWebPage("https://github.com/CristobalPerezR/WikiDesk/issues")}}>Report Issue</span>
            </div>
        </>
    )
}

export default Frame;