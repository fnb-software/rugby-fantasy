import "server-only";
import { get } from "@vercel/blob";
import { cache } from "react";

const PREFIX = process.env.BLOB_PREFIX ?? "";

export const blobKey = (userId: string): string =>
  `players/${PREFIX}${userId}.json`;

export const playersTag = (userId: string): string => `players:${userId}`;

const fetchFromBlob = async (userId: string): Promise<unknown[]> => {
  const result = await get(blobKey(userId), { access: "private" });
  if (!result || result.statusCode !== 200) {
    throw new Error(`Players blob not found for user`);
  }
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as unknown[];
};

export const getPlayers = cache(fetchFromBlob);
