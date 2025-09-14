"use client";

import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {CalendarDays, RefreshCw} from "lucide-react";
import {Button} from "@/components/ui/button";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  attachments?: {
    media_keys?: string[];
  };
  author_id: string;
}

interface Media {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
}

interface TwitterResponse {
  tweets: Tweet[];
  media?: Media[];
  lastFetch?: string;
  nextFetch?: string;
  rateLimited?: boolean;
}

export function SiegeCupTweets() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [nextFetch, setNextFetch] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      setError(null);
      setRateLimited(false);

      const endpoint = "/api/tweets";
      const response = await fetch(endpoint);
      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${textResponse.substring(0, 100)}`
        );
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tweets");
      }

      setTweets(data.tweets || []);
      setMedia(data.media || []);
      setLastFetch(data.lastFetch);
      setNextFetch(data.nextFetch);
      setRateLimited(data.rateLimited || false);

      if (data.rateLimited) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMediaForTweet = (tweet: Tweet) => {
    if (!tweet.attachments?.media_keys || !media) return [];
    return media.filter((m) =>
      tweet.attachments!.media_keys!.includes(m.media_key)
    );
  };

  // Filter tweets to only those containing "Siege Cup"
  const filteredTweets = tweets.filter(
    (tweet) => tweet.text && tweet.text.toLowerCase().includes("siege cup")
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading tweets...</span>
      </div>
    );
  }

  if (error && !rateLimited) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-destructive mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => fetchTweets()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
            {error.includes("Twitter Bearer Token") && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                {/* Setup instructions if needed */}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>
                Last updated: {lastFetch ? formatDate(lastFetch) : "Never"}
              </span>
              {rateLimited && (
                <Badge
                  variant="outline"
                  className="ml-2 border-red-500 text-red-700 dark:text-red-400">
                  Rate Limited
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span>
                Next update: {nextFetch ? formatDate(nextFetch) : "Unknown"}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fetchTweets()}
                  disabled={rateLimited}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          {rateLimited && error && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tweets */}
      {filteredTweets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground space-y-4">
              <p>No Siege Cup tweets found from @Rainbow6Game</p>
              <p className="text-sm">Check back later for updates!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTweets.map((tweet) => {
            const tweetMedia = getMediaForTweet(tweet);

            return (
              <Card key={tweet.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">@Rainbow6Game</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(tweet.created_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="leading-relaxed whitespace-pre-wrap text-black dark:text-white">
                    {tweet.text}
                  </p>
                  {tweetMedia.length > 0 && (
                    <div className="space-y-2">
                      {tweetMedia.map((mediaItem) => (
                        <div key={mediaItem.media_key}>
                          {mediaItem.type === "photo" && mediaItem.url && (
                            <img
                              src={mediaItem.url || "/placeholder.svg"}
                              alt="Tweet image"
                              className="rounded-lg max-w-full h-auto"
                              crossOrigin="anonymous"
                            />
                          )}
                          {mediaItem.type === "video" &&
                            mediaItem.preview_image_url && (
                              <div className="relative">
                                <img
                                  src={
                                    mediaItem.preview_image_url ||
                                    "/placeholder.svg"
                                  }
                                  alt="Video preview"
                                  className="rounded-lg max-w-full h-auto"
                                  crossOrigin="anonymous"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                  <div className="bg-white/90 rounded-full p-3">
                                    <svg
                                      className="h-6 w-6 text-black"
                                      fill="currentColor"
                                      viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
