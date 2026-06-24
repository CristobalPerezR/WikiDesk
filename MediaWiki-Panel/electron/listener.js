import axios from "axios";

const axiosConn = axios.create({
    baseURL: "http://localhost:7060/",
    headers: {
        "Content-Type": "application/json"
    }
});

export async function watcher() {
    try{
        const configs = await axiosConn.get("/INTERNAL_GetConfig");
        return {
            "DONE": true,
            "MIN_FRONT": configs.data.user_conf.MIN_FRONT,
            "ON_MINIMIZE": configs.data.user_conf.ON_MINIMIZE
        };
    } catch(e){
        // console.log("listener.js: ", e);
        return{
            "DONE": false
        }
    }
}