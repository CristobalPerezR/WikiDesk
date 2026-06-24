// Server/src/index.ts
import express from 'express';
import cors from "cors";

import confRoutes from "./userConfigs/configRoutes.js";
import actionsRoutes from "./apiActions/actionsRoutes.js";

// Iniciadores artificiales
import { savepaths_init } from "./tools/save_path.js";
import { watchers_init } from './tools/watchers.js';
savepaths_init();
watchers_init();

const app = express();

app.use(express.json());
app.use(cors());

// ROUTES
app.use(confRoutes); // LOCAL -> Configs
app.use(actionsRoutes); // API -> MediaWiki


const PORT = 7060;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`, "ON");
});