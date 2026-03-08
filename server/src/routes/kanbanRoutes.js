import { Router } from 'express';
import {
  getBoard,
  addColumn,
  deleteColumn,
  addCard,
  updateCard,
  deleteCard,
  moveCard,
} from '../controllers/kanbanController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', getBoard);
router.post('/columns', addColumn);
router.delete('/columns/:columnId', deleteColumn);
router.post('/columns/:columnId/cards', addCard);
router.patch('/columns/:columnId/cards/:cardId', updateCard);
router.delete('/columns/:columnId/cards/:cardId', deleteCard);
router.patch('/move', moveCard);

export default router;