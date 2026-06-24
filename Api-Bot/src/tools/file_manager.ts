import fs from "fs";
import path from "path";

const config_path = process.env.CONFIG_DIR as string;
// const config_path = "src/config";

export const user_config_path = path.join(config_path,"user_config.json");
export const conn_config_path = path.join(config_path,"conn.json");
export const save_memory_path = path.join(config_path, "saved_memory.json");

let conn_conf = JSON.parse(fs.readFileSync(conn_config_path, "utf-8"));
let user_conf = JSON.parse(fs.readFileSync(user_config_path, "utf-8"));

export let auth = {
    username: conn_conf.USERNAME,
    password: conn_conf.PASSWORD,
    api_url: conn_conf.API_URL
}

export let options = {
    save: user_conf.SAVE_IN,
    autoapprove: user_conf.AUTO_APPROVE,
    securepage: user_conf.SECURE_PAGE
}


//#region Updates
export function update_options(user_conf: any){
    options = {
        save: user_conf.SAVE_IN,
        autoapprove: user_conf.AUTO_APPROVE,
        securepage: user_conf.SECURE_PAGE
    }
}

export function update_auth(conn_conf: any){
    auth = {
        username: conn_conf.USERNAME,
        password: conn_conf.PASSWORD,
        api_url: conn_conf.API_URL
    };
}