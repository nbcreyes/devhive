import { AccessToken } from 'livekit-server-sdk';

/**
 * Generates a LiveKit access token for a user to join a voice channel.
 * The room name is the channel ID so each voice channel has its own room.
 *
 * @param {{ userId: string, username: string, channelId: string }} options
 * @returns {Promise<string>} Signed JWT token
 */
export async function generateVoiceToken({ userId, username, channelId }) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: userId,
      name: username,
    }
  );

  token.addGrant({
    room: channelId,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishScreen: true,
  });

  return await token.toJwt();
}