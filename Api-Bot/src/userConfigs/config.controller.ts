import type { Response, Request } from "express";
import { conn } from "../config/api.js"
import fs from "fs";
import { user_config_path, conn_config_path } from "../tools/file_manager.js";

export const GetConfiguration = async(req:Request, res:Response) => {
    try{
        const user = await JSON.parse(fs.readFileSync(user_config_path, "utf-8"));
        const conn = await JSON.parse(fs.readFileSync(conn_config_path, "utf-8"));

        return res.status(200).json({
            "user_conf" : user,
            "conn_conf" : conn
        });
    } catch(e){
        console.error("error => config.controller.ts -> GetConfiguration: ", e);
        res.status(500).json();
    }
};

export const UpdateUserConfiguration = async(req:Request, res:Response) =>{
    try{ 
        const { savein, autoapprove, onminimize, minfront, securepage } = req.body;

        const new_conf = JSON.stringify({
            "SAVE_IN": savein,
            "AUTO_APPROVE": autoapprove,
            "ON_MINIMIZE": onminimize, 
            "MIN_FRONT": minfront,
            "SECURE_PAGE": securepage
        });

        await fs.writeFileSync(user_config_path, new_conf, "utf-8");
        const check = await JSON.parse(fs.readFileSync(user_config_path, "utf-8"));
        return res.status(200).json(check);
    } catch(e){
        console.error("error => config.controller.ts -> UpdateUserConfiguration: ", e);
        res.status(500).json();
    }
};

export const UpdateConnConfiguration = async(req:Request, res:Response) =>{
    try{ 
        const { api_url, username, password } = req.body;

        const new_conf = JSON.stringify({
            "API_URL" : api_url,
            "USERNAME" : username,
            "PASSWORD" : password
        })

        await fs.writeFileSync(conn_config_path, new_conf, "utf-8");
        const check = await JSON.parse(fs.readFileSync(conn_config_path, "utf-8"));
        return res.status(200).json(check);

    } catch(e){
        console.error("error => config.controller.ts -> UpdateConnConfiguration: ", e);
        res.status(500).json();
    }
};

export const TestConnection = async(req: Request, res: Response) =>{
    try {
        const { test_url } = req.body;
        
        const result = await conn.get(test_url, {
            params: {
                action: "query",
                meta: "siteinfo",
                format: "json"
            }
        });

        res.status(200).json(result.data);
    } catch(e){
        console.error("error => config.controller.ts -> TestConnection: ", e);
        res.status(404).json();
    }
};