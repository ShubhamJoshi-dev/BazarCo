import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { listAddresses, createAddress, updateAddress, deleteAddress } from "../controllers/addressController";

export const addressesRouter = Router();

addressesRouter.use(requireAuth);
addressesRouter.get("/", listAddresses);
addressesRouter.post("/", createAddress);
addressesRouter.patch("/:id", updateAddress);
addressesRouter.delete("/:id", deleteAddress);
