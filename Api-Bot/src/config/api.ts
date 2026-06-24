import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

import { auth } from "../tools/file_manager.js";

export let conn = wrapper(axios.create({baseURL: ""}));
const jar = new CookieJar();

if (auth.api_url){
    conn = wrapper(
        axios.create({
            baseURL: auth.api_url,
            jar,
            withCredentials: true,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
    );
}

export function update_url_conn(api_url: string){
    console.log("url updated: ", api_url);
    conn = wrapper(
        axios.create({
            baseURL: api_url,
            jar,
            withCredentials: true,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
    );
}