import { Router } from "express";
import { Login, Logout, Pull, Push, Tick } from "./actions.controller.js";

const router: Router = Router();

router.post('/login', Login);
router.post('/logout', Logout);
router.post('/pull_page', Pull);
router.post('/push_page', Push);

router.get('/TOOL_tick', Tick);

export default router;