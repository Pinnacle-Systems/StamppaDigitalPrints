import { Router } from 'express';
const router = Router();
import { create,get ,getOne,update,remove} from '../controllers/po.controller.js';


router.post('/', create);
router.get('/', get);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;