import axios from "axios";

import { TWITTER_API_ACCESS_TOKEN, TWITTER_API_URL } from "~/config";

const twitterApi = axios.create({
  baseURL: TWITTER_API_URL,
  headers: {
    Authorization: `Bearer ${TWITTER_API_ACCESS_TOKEN}`,
  },
});

export interface RichTweet {
  id: string;
  text: string;
  createdAt: string;
  user: {
    username: string;
    name: string;
    profilePictureUrl: string | null;
    url: string | null;
  };
  previewImage: string | null;
}

export interface TwitterServiceInterface {
  getRecentTweets: (query: string) => Promise<RichTweet[]>;
}

const TwitterInternal: TwitterServiceInterface = {
  getRecentTweets: async (query: string) => {
    const {
      data: {
        data: tweets,
        includes: { users, media },
      },
    } = await twitterApi.get(
      `/tweets/search/recent?query=${encodeURIComponent(
        query
      )}&max_results=10&tweet.fields=created_at&expansions=author_id,attachments.media_keys&media.fields=media_key,type,url&user.fields=description,profile_image_url,url`
    );

    return tweets.map((tweet: any) => {
      const userTweet = users.find((u: any) => u.id === tweet.author_id);
      let mediaTweet: any | undefined;
      tweet.attachments?.media_keys.forEach((media_key: any) => {
        mediaTweet = media.find(
          (m: any) => m.media_key === media_key && m.type === "photo"
        );
        if (mediaTweet) {
          return;
        }
      });

      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        user: {
          username: userTweet.username,
          name: userTweet.name,
          profilePictureUrl: userTweet.profile_image_url ?? null,
          url: userTweet.url ?? null,
        },
        previewImage: mediaTweet !== undefined ? mediaTweet.url : null,
      };
    });
  },
};

let recentTweets = new Map<
  string,
  {
    tweets: RichTweet[];
    lastUpdated: number;
  }
>();

export const Twitter: TwitterServiceInterface = {
  getRecentTweets: async (query: string) => {
    let cached = recentTweets.get(query);
    if (!cached || cached.lastUpdated > Date.now() - 1000 * 60 * 60 * 2) {
      cached = {
        tweets: await TwitterInternal.getRecentTweets(query),
        lastUpdated: Date.now(),
      };
      recentTweets.set(query, cached);
    }

    return cached.tweets;
  },
};
