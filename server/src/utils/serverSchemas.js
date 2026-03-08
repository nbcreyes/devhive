import { z } from 'zod';

/**
 * Validation schema for creating a server.
 */
export const createServerSchema = z.object({
  name: z
    .string()
    .min(2, 'Server name must be at least 2 characters')
    .max(100, 'Server name must be at most 100 characters'),
  description: z
    .string()
    .max(512, 'Description must be at most 512 characters')
    .optional(),
});

/**
 * Validation schema for creating a channel.
 */
export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(100, 'Channel name must be at most 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, and hyphens'),
  type: z
    .enum(['text', 'voice', 'code'])
    .optional(),
  topic: z
    .string()
    .max(256, 'Topic must be at most 256 characters')
    .optional(),
});

/**
 * Validation schema for updating a channel.
 */
export const updateChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(100, 'Channel name must be at most 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  topic: z
    .string()
    .max(256, 'Topic must be at most 256 characters')
    .optional(),
});