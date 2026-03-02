import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createOffer,
  listOffers,
  getOfferById,
  acceptOffer,
  rejectOffer,
  counterOffer,
  acceptCounter,
  respondToCounter,
} from "../controllers/offerController";

export const offersRouter = Router();

offersRouter.use(requireAuth);

offersRouter.post("/", createOffer);
offersRouter.get("/", listOffers);
offersRouter.get("/:id", getOfferById);
offersRouter.patch("/:id/accept", acceptOffer);
offersRouter.patch("/:id/reject", rejectOffer);
offersRouter.patch("/:id/counter", counterOffer);
offersRouter.patch("/:id/accept-counter", acceptCounter);
offersRouter.patch("/:id/respond", respondToCounter);
