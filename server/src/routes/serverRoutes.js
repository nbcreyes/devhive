import { Router } from 'express';
import {
  createServer,
  getMyServers,
  getServer,
  getServerByInvite,
  joinServer,
  deleteServer,
} from '../controllers/serverController.js';
import {
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel,
  getMembers,
} from '../controllers/channelController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { createServerSchema } from '../utils/serverSchemas.js';
import { createChannelSchema, updateChannelSchema } from '../utils/serverSchemas.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Server routes
router.post('/', validate(createServerSchema), createServer);
router.get('/', getMyServers);
router.get('/:serverId', getServer);
router.delete('/:serverId', deleteServer);

// Invite routes
router.get('/invite/:inviteCode', getServerByInvite);
router.post('/invite/:inviteCode/join', joinServer);

// Channel routes
router.post('/:serverId/channels', validate(createChannelSchema), createChannel);
router.get('/:serverId/channels', getChannels);
router.patch('/:serverId/channels/:channelId', validate(updateChannelSchema), updateChannel);
router.delete('/:serverId/channels/:channelId', deleteChannel);

// Member routes
router.get('/:serverId/members', getMembers);

export default router;