import { Router } from 'express';
import {
  authorize,
  callback,
  getRepoFeed,
  getGithubStatus,
  disconnectGithub,
} from '../controllers/githubController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/authorize', requireAuth, authorize);
router.get('/callback', callback);
router.get('/status', requireAuth, getGithubStatus);
router.get('/repos/:owner/:repo/feed', requireAuth, getRepoFeed);
router.delete('/disconnect', requireAuth, disconnectGithub);

export default router;