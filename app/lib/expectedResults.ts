import "server-only";
import { get } from "@vercel/blob";
import { cache } from "react";

const PREFIX = process.env.BLOB_PREFIX ?? "";

export type ExpectedResults = Record<string, Record<string, number>>;

export const expectedResultsBlobKey = (userId: string): string =>
  `expected-results/${PREFIX}${userId}.json`;

const fetchFromBlob = async (userId: string): Promise<ExpectedResults> => {
  const result = await get(expectedResultsBlobKey(userId), {
    access: "public",
  });
  if (!result || result.statusCode !== 200) return {};
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as ExpectedResults;
};

export const getExpectedResults = cache(fetchFromBlob);
