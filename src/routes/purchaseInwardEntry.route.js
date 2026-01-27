import { Router } from "express";
const router = Router();
import {
  get,
  getOne,
  create,
  update,
  remove,
  getPurchaseDetail,
  getPurInwardItems
} from "../controllers/purchaseInwardEntry.controller.js";

router.post("/", create);

router.get("/", get);
router.get('/purInwardItemDetails', getPurInwardItems);
router.get("/purchaseDetail", getPurchaseDetail);

router.put("/:id", update);

router.get("/:id", getOne);
router.delete("/:id", remove);

export default router;
