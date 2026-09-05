import 'server-only';
import { get } from '@vercel/blob';
import { cache } from 'react';

const PREFIX = process.env.BLOB_PREFIX ?? '';

export const blobKey = (userId: string): string =>
  `players/2027/${PREFIX}${userId}.json`; // TODO dynamic year

export const playersTag = (userId: string): string => `players:${userId}`;

const fetchFromBlob = async (userId: string): Promise<unknown[]> => {
  const result = await get(blobKey(userId), { access: 'public' });
  if (!result || result.statusCode !== 200) return [];
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as unknown[];
};

export const getPlayers = cache(fetchFromBlob);
