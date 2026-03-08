import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  updateAvatar,
  getMyServers,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/me/servers', getMyServers);
router.patch('/me', updateProfile);
router.patch('/me/avatar', updateAvatar);
router.get('/:userId', getUserProfile);

export default router;