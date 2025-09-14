import {Redis} from "@upstash/redis";
import {NextResponse} from "next/server";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const CACHE_KEY = "siege-cup-upstash";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  const now = Date.now();

  // Try to get cached data from Redis
  const cachedRaw = await redis.get(CACHE_KEY);
  let cached: {data: any; cachedAt: number} | null = null;
  if (cachedRaw) {
    try {
      cached =
        typeof cachedRaw === "string" ? JSON.parse(cachedRaw) : cachedRaw;
    } catch {
      cached = null;
    }
  }
  if (cached && cached.cachedAt && now - cached.cachedAt < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      return NextResponse.json({
        error:
          "Twitter Bearer Token not configured. Please add TWITTER_BEARER_TOKEN to your environment variables.",
        tweets: [],
        media: [],
        lastFetch: null,
        nextFetch: null,
        rateLimited: false,
      });
    }

    const username = "Rainbow6Game";
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {headers: {Authorization: `Bearer ${bearerToken}`}}
    );
    if (!userRes.ok) {
      const errorData = await userRes.json();
      return NextResponse.json(
        {
          error: "Failed to fetch Twitter user",
          details: errorData,
          tweets: [],
          media: [],
          lastFetch: null,
          nextFetch: null,
          rateLimited: userRes.status === 429,
        },
        {status: userRes.status}
      );
    }
    const userData = await userRes.json();
    const userId = userData.data?.id;

    const tweetRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?expansions=attachments.media_keys&media.fields=url,type&tweet.fields=created_at,attachments,author_id,text`,
      {headers: {Authorization: `Bearer ${bearerToken}`}}
    );
    if (!tweetRes.ok) {
      const errorData = await tweetRes.json();
      return NextResponse.json(
        {
          error: "Failed to fetch tweets",
          details: errorData,
          tweets: [],
          media: [],
          lastFetch: null,
          nextFetch: null,
          rateLimited: tweetRes.status === 429,
        },
        {status: tweetRes.status}
      );
    }
    const tweetData = await tweetRes.json();

    // Filter tweets to only those containing "Siege Cup"
    const filteredTweets = (tweetData.data || []).filter(
      (tweet: any) =>
        tweet.text && tweet.text.toLowerCase().includes("siege cup")
    );

    const responseData = {
      tweets: filteredTweets,
      media: tweetData.includes?.media || [],
      lastFetch: new Date().toISOString(),
      nextFetch: new Date(now + CACHE_DURATION).toISOString(),
      rateLimited: false,
      isTestData: false,
    };

    // Store in Redis
    await redis.set(CACHE_KEY, {data: responseData, cachedAt: now});

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        tweets: [],
        media: [],
        lastFetch: null,
        nextFetch: null,
        rateLimited: false,
      },
      {status: 500}
    );
  }
}
