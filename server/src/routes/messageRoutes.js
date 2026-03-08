import { Router } from 'express';
import { getMessages, deleteMessage, editMessage } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', getMessages);
router.patch('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

export default router;