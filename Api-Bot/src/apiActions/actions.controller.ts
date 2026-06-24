import type { Response, Request } from "express";
import { conn } from "../config/api.js"
import { auth, options } from "../tools/file_manager.js";
import fs from "fs";

import { save_memory_path } from "../tools/file_manager.js";

var page_id: string | undefined;
var page_title: string; 

export const Login = async(req: Request, res: Response):Promise < void > => {
    try{
        const token = await GetLoginToken();

        if (!token){
            res.status(500).json({ error: "No se pudo obtener el token de inicio de sesión" });
            return;
        }

        const data = new URLSearchParams({
            action: "login",
            lgname: auth.username,
            lgpassword: auth.password,
            lgtoken: token,
            format: "json"
        });

        const result = await conn.post("", data);

        if (options.securepage) {
            const done = await GetSaveFromMemory();
            if (done){
                res.status(200).json({
                    "login": result.data,
                    "memory": {
                        "id": page_id,
                        "title": page_title
                    }
                })
            } else{
                res.status(200).json({
                    "login": result.data,
                    "memory": {}
                });
            }
        } else{
            res.status(200).json({
                "login": result.data,
                "memory": {}
            });
        }

    } catch (e){
        console.error("error => actions.controller.ts -> Login: ", e);
        res.status(500).json({ error: "MediaWiki request failed" });
    }
};

export const Logout = async(req: Request, res: Response):Promise < void > => {
    try{
        const token = await GetCsrfToken();
        if (!token){
            res.status(500).json({ error: "No se pudo obtener el token CSRF" });
            return;
        }
        
        const data = new URLSearchParams({
            action: "logout",
            token: token,
            format: "json"
        });

        const result = await conn.post("", data);

        res.status(200).json(result.data);

    } catch (e){
        console.error("error => actions.controller.ts -> Logout: ", e);
        res.status(500).json({ error: "MediaWiki request failed" });
    }
};

export const Tick = async(req: Request, res: Response):Promise < void > => {
    try{
        const result = await conn.get("", {
            params: {
                action: "query",
                meta: "userinfo",
                format: "json"
            }
        });

        res.status(200).json(result.data);
    } catch (e){
        console.error("error => actions.controller.ts -> Tick: ", e);
        res.status(500).json({ error: "MediaWiki request failed" });
    }
};

export const Pull = async(req: Request, res: Response) =>{
    try {
        const { title } = req.body;

        const result = await conn.get("", {
            params: {
                action: "query",
                prop: "revisions",
                rvprop: "timestamp|user|comment|content",
                rvslots: "*",
                format: "json",
                titles: title,              
                rvlimit: "1"
            }
        });

        const page = result.data?.query?.pages;
        page_id = page ? Object.keys(page)[0] as string : undefined; // SI LA PAGINA NO EXISTE MARCA UN -1
        const firstPage = page_id ? page[page_id] : undefined;
        page_title = firstPage.title as string;

        fs.writeFileSync( options.save+"\\temp.wikitext", firstPage.revisions?.[0].slots?.main?.["*"] ?? "");

        if (options.securepage){
            const memory = await SaveOnMemory();
            if (!memory){
                console.log("Algo falló al guardar en memoria");
            }
        }

        res.status(200).json({
            "id": page_id,
            "title": page_title
        });
    } catch (e){
        console.error("error => actions.controller.ts -> Pull: ", e);
        res.status(500).json({ error: "MediaWiki request failed" });
    }
};

export const Push = async(req: Request, res: Response) => {
    try {
        const token = await GetCsrfToken();
        
        const { summary } = req.body; 

        if (!page_id){
            res.status(500).json({ error: "Haz Pull Primero" });
            return;
        }

        if (!token){
            res.status(500).json({ error: "No se pudo obtener el token CSRF" });
            return;
        }

        const wikitext =  fs.readFileSync(options.save+"\\temp.wikitext", "utf-8");

        const data = new URLSearchParams({
            action: "edit",
            pageid: page_id,
            bot: "1",
            summary: "API-UPDATE: "+summary,
            text: wikitext,
            nocreate: "true",
            token: token,
            format: "json"
        });

        let result = await conn.post("", data)

        const captcha = result.data?.edit?.captcha;

        if (captcha){
            const solved = await Captcha_Solver(captcha.question);

            data.append("captchaid", captcha.id);
            data.append("captchaword", solved);

            result = await conn.post("", data);
        }

        if (options.autoapprove){
            try{
                const approve = await Auto_Approve();
                res.status(200).json({
                    "result": result.data,
                    "approve": approve.data
                });

            } catch(e) {
                console.log("error => actions.controller.ts -> Push -> await Auto_Approve: ", e);
                res.status(500).json({ error: "MediaWiki request failed" });
            }
        } else{
            res.status(200).json(result.data);
        }
    } catch (e){
        console.error("error => actions.controller.ts -> Push: ", e);
        res.status(500).json({ error: "MediaWiki request failed" });
    }
};

export const UpdateSaveOnMemory = async(req: Request, res: Response) => { // NO USED NOR IMPLEMETED
    try{
        const { id, title } = req.body;
        const save = JSON.stringify({
            "PAGE_ID": id,
            "PAGE_NAME": title
        });
        
        await fs.writeFileSync(save_memory_path, save, "utf-8");
        const result = await JSON.parse(fs.readFileSync(save_memory_path, "utf-8"))
        
        res.status(200).json(result);
    } catch(e){
        console.error("error => actions.controller.ts -> UpdateSaveOnMemory: ", e);
        res.status(500).json();
    }
}

//#region General Functions
const GetLoginToken = async(): Promise < string | null >  => {
    try{
        const result = await conn.get("", {
            params: {
                action: "query",
                meta: "tokens",
                type: "login",
                format: "json"
            }
        });

        return result.data?.query?.tokens?.logintoken || null;

    } catch (e: unknown){
        if (e instanceof Error && e.message){
            console.log("error => actions.controller.ts -> GetLoginToken: ", e.message)
            return null;
        }
        console.error("Error obteniendo el token:", e);
        return null;
    }
};

const GetCsrfToken = async(): Promise < string | null > =>{
    try{
        const result = await conn.get("", {
            params: {
                action: "query",
                meta: "tokens",
                format: "json"
            }
        });
        return result.data?.query?.tokens?.csrftoken || null;

    } catch (e){
        console.error("error => actions.controller.ts -> GetCsrfToken: ", e);
        return null;
    }
};

//#region Push Functions
const Captcha_Solver = async(question: string): Promise < string >  => {
    const resultado = new Function(`return ${question.replace(/−/g, '-').trim()}`)();
    return resultado;
};

const Auto_Approve = async() => {
    try{
        const token = await GetCsrfToken();

        if (!token){
            return null;
        }

        const result = await conn.get("", {
            params: {
                action: "query",
                pageids: page_id,
                prop: "revisions",
                rvprop: "ids",
                rvslots: "*",    
                rvlimit: "1",
                format: "json"
            }
        });

        const page = result.data?.query?.pages;
        const firstPage = page_id as unknown as number ? page[page_id as unknown as number] : undefined;
        const rev_id = firstPage.revisions?.[0].revid;

        const data = new URLSearchParams({
            action: "approve",
            revid: rev_id,
            token: token,
            format: "json"
        });

        const approve = await conn.post("", data);

        return approve.data;
    } catch (e) {
        console.error("error => actions.controller.ts -> Auto_Approve: ", e);
        return null;
    }
};

//#region Login/Pull Functions
const SaveOnMemory = async() => {
    try{
        const save = JSON.stringify({
            "PAGE_ID": page_id,
            "PAGE_NAME": page_title
        });

        await fs.writeFileSync(save_memory_path, save, "utf-8");
        return true;
    } catch (e) {
        console.error("error => actions.controller.ts -> SaveOnMemory:  ", e);
        return false;
    }
};

const GetSaveFromMemory = async() =>{
    try{
        const save = await JSON.parse(fs.readFileSync(save_memory_path, "utf-8"));
        page_id = save.PAGE_ID,
        page_title = save.PAGE_NAME

        return true;

    } catch (e) {
        console.error("error => actions.controller.ts -> GetSaveFromMemory: ", e);
        return false;
    }
};