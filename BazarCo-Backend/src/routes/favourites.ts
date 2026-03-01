import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { addFavourite, removeFavourite, listFavourites, checkFavourite } from "../controllers/favouriteController";

export const favouritesRouter = Router();

favouritesRouter.use(requireAuth);
favouritesRouter.get("/", listFavourites);
favouritesRouter.get("/check/:productId", checkFavourite);
favouritesRouter.post("/:productId", addFavourite);
favouritesRouter.delete("/:productId", removeFavourite);
