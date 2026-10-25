import express from "express";
import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    updateUser
} from "../controllers/userController.js";
import { protectAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.use(protectAdmin);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
