import fs from "fs";

import { update_url_conn } from "../config/api.js";
import { update_paths } from "./save_path.js";
import { update_auth, update_options, user_config_path, conn_config_path } from "./file_manager.js";

let conn_conf = JSON.parse(fs.readFileSync(conn_config_path, "utf-8"));
let user_conf = JSON.parse(fs.readFileSync(user_config_path, "utf-8"));

fs.watchFile(user_config_path, { interval: 500 }, () => {
    user_conf = JSON.parse(fs.readFileSync(user_config_path, "utf-8"));
    update_options(user_conf);
    update_paths(user_conf.SAVE_IN);
});

fs.watchFile(conn_config_path, { interval: 500 }, () => {
    conn_conf = JSON.parse(fs.readFileSync(conn_config_path, "utf-8"));
    update_auth(conn_conf);
    update_url_conn(conn_conf.API_URL);
});

export const watchers_init = () => {}