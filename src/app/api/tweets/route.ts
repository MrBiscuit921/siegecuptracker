import {NextResponse} from "next/server";

let cachedData: any = null;
let cachedAt: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  const now = Date.now();
  // Serve cached data if it's less than 24 hours old
  if (cachedData && cachedAt && now - cachedAt < CACHE_DURATION) {
    return NextResponse.json(cachedData);
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

    // Cache the response
    cachedData = responseData;
    cachedAt = now;

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
