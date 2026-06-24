import { options, user_config_path } from "./file_manager.js"
import fs from "fs";
import path from "path";

if (!options.save){
    const dir = "../../wikitexts"
    const FullPath = path.resolve(dir);

    if (!(fs.existsSync(dir) && fs.statSync(dir).isDirectory())) {
        fs.mkdirSync(dir);
    }
    
    const raw = fs.readFileSync(user_config_path, "utf-8");
    const data = JSON.parse(raw);

    data.SAVE_IN = FullPath;

    fs.writeFileSync(user_config_path, JSON.stringify(data, null, 4), "utf-8");
} else{
    if (!(fs.existsSync(options.save) && fs.statSync(options.save).isDirectory())) {
        fs.mkdirSync(options.save, {recursive: true});
    }
}

export function update_paths(dir: string){
    if (options.save){
        if (!(fs.existsSync(dir) && fs.statSync(dir).isDirectory())) {
            fs.mkdirSync(dir, {recursive: true});
        }
    }
}

export const savepaths_init = () => {}