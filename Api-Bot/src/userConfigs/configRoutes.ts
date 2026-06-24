import { Router } from "express";
import { GetConfiguration, TestConnection, UpdateUserConfiguration, UpdateConnConfiguration } from "./config.controller.js";

const router: Router = Router();

router.post("/INTERNAL_TestConnection", TestConnection); // -> TO API

router.get("/INTERNAL_GetConfig", GetConfiguration);
router.post("/INTERNAL_UpdateUser", UpdateUserConfiguration);
router.post("/INTERNAL_UpdateConn", UpdateConnConfiguration)

export default router;