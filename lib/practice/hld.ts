import type { Practice } from './types';

/** "Try it yourself" exercises for the HLD case studies, keyed by page URL. */
export const HLD_PRACTICE: Record<string, Practice> = {
  '/hld/url-shortener': {
    prompt: 'Design a URL shortener like bit.ly that turns long URLs into 7-character links and redirects visitors.',
    requirements: [
      'Create a short link for a long URL, optionally with a custom alias and an expiry',
      'Redirect a short link to the original URL with low latency',
      'About 100 million new links a month, with reads far outnumbering writes (around 100:1)',
      'Links must never collide, and redirects should stay available during partial failures',
      'Basic click analytics per link',
    ],
    hints: [
      'Estimate first: how many links over 5 years, and how many characters of base62 does that need?',
      'Compare hashing the URL, a counter encoded in base62, and pre-generated key ranges. Which one avoids collisions without coordination?',
      'Redirects are read-heavy and immutable. Where would you cache, and should the redirect be a 301 or a 302 if you want analytics?',
    ],
  },
  '/hld/pastebin': {
    prompt: 'Design Pastebin: users paste text, get a short link, and anyone with the link can read it until it expires.',
    requirements: [
      'Create a paste (up to a few MB of text) and return a unique short link',
      'Read a paste by link, with optional expiry and private (unlisted) pastes',
      'Millions of new pastes a day, reads around 5 times writes',
      'Pastes must not be lost before they expire',
      'Expired pastes stop being served and are cleaned up',
    ],
    hints: [
      'Should the paste text live in the same database as its metadata? Think about size and cost.',
      'How will you generate keys, and how is this similar to a URL shortener?',
      'Expiry: delete eagerly with a scheduled job, lazily on read, or both?',
    ],
  },
  '/hld/rate-limiter': {
    prompt: 'Design a distributed rate limiter that every API server consults before handling a request.',
    requirements: [
      'Limit requests per user, per API key or per IP, with different limits per endpoint',
      'Return HTTP 429 with headers telling the client when to retry',
      'Work across many API servers, so limits are global rather than per server',
      'Add only a few milliseconds of latency per request',
      'Keep serving traffic if the rate limiter store is unavailable',
    ],
    hints: [
      'Compare token bucket, leaky bucket, fixed window and sliding window. Which handles bursts the way you want?',
      'Where does the counter live so all servers share it, and how do you update it atomically?',
      'If the counter store is down, do you fail open or fail closed? Defend the choice.',
    ],
  },
  '/hld/typeahead': {
    prompt: 'Design search autocomplete: as a user types, show the top 10 suggestions within 100 ms.',
    requirements: [
      'Return the top suggestions for a prefix, ranked by popularity',
      'Respond within about 100 ms end to end, at very high query volume',
      'Suggestions reflect recent trends within hours, not instantly',
      'Support many languages',
      'Filter out offensive suggestions',
    ],
    hints: [
      'What data structure answers "top K completions for this prefix" quickly, and can you precompute the top K at each node?',
      'Separate the read path (serve suggestions) from the write path (aggregate query logs). How often do you rebuild?',
      'How would you shard the structure, and what can the client do to cut requests (debounce, caching)?',
    ],
  },
  '/hld/web-crawler': {
    prompt: 'Design a web crawler that downloads a billion pages a month to feed a search index.',
    requirements: [
      'Start from seed URLs, fetch pages, extract links and keep crawling',
      'Respect robots.txt and never overload a single site (politeness)',
      'Avoid fetching the same URL or the same content twice',
      'Recrawl important pages more often than others',
      'Scale horizontally and survive worker crashes without losing progress',
    ],
    hints: [
      'Design the URL frontier: how do you combine priority with per-host politeness queues?',
      'How do you detect duplicate URLs and near-duplicate content at this scale?',
      'What gets cached (DNS, robots.txt), and how do you avoid crawler traps?',
    ],
  },
  '/hld/twitter': {
    prompt: 'Design Twitter: users post short tweets, follow others, and read a home timeline of tweets from people they follow.',
    requirements: [
      'Post a tweet, follow and unfollow users',
      'Home timeline loads in under 200 ms',
      'Hundreds of millions of daily users; a few accounts have over 100 million followers',
      'Search tweets and show trending topics',
      'Timelines can be eventually consistent by a few seconds',
    ],
    hints: [
      'Fan-out on write (push to followers\' timelines) or fan-out on read (pull at read time)? What happens for a celebrity?',
      'Where do precomputed timelines live, and how many tweets do you keep per user?',
      'Estimate reads vs writes per second. Which path should be the cheap one?',
    ],
  },
  '/hld/instagram': {
    prompt: 'Design Instagram: users upload photos and videos, follow others, and scroll a ranked feed.',
    requirements: [
      'Upload photos and short videos; view them quickly anywhere in the world',
      'Follow users and see a feed of their posts, ranked',
      'Likes, comments and notifications',
      'Over a billion users; media storage grows by petabytes',
      'Feed loads fast on mobile networks',
    ],
    hints: [
      'Separate the media path (upload, processing, CDN) from the metadata path (posts, follows, likes).',
      'What resolutions or formats do you generate on upload, and how is that work queued?',
      'How is the feed built and ranked, and what do you cache?',
    ],
  },
  '/hld/whatsapp': {
    prompt: 'Design WhatsApp: one-to-one and group messaging with delivery and read receipts.',
    requirements: [
      'Send messages to a user or a group of up to about 1,000 members',
      'Deliver messages to offline users when they come back online',
      'Show sent, delivered and read ticks, and online or last-seen presence',
      'End-to-end encryption: the server cannot read messages',
      'Billions of messages a day with low latency',
    ],
    hints: [
      'How does a message reach a device that is online, and where does it wait if the device is offline?',
      'What kind of connection do clients keep with the server, and how do you route a message to the server holding the recipient\'s connection?',
      'Group messages: fan out on the server or on the sender\'s device? How does encryption affect that?',
    ],
  },
  '/hld/slack': {
    prompt: 'Design Slack: workspaces with channels where messages appear in real time for every member.',
    requirements: [
      'Post messages to channels and direct messages; members see them within about a second',
      'Message history with search',
      'Presence, typing indicators and unread counts',
      'Workspaces from 5 to 100,000+ members',
      'Data isolation between workspaces (companies)',
    ],
    hints: [
      'How does a message posted to a channel reach every connected member? What sits between the API and the WebSocket connections?',
      'How would you shard data: by workspace, by channel, or something else? What breaks for very large workspaces?',
      'Presence for 100,000 users can be chattier than messages. How do you keep it cheap?',
    ],
  },
  '/hld/news-feed': {
    prompt: 'Design the news feed for a social network like Facebook.',
    requirements: [
      'Show a user a feed of posts from friends and pages they follow',
      'Feed is ranked, not just reverse chronological',
      'New posts appear within a few seconds',
      'Hundreds of millions of daily users, each opening the feed several times a day',
      'Feed loads in under 200 ms',
    ],
    hints: [
      'Push, pull or hybrid fan-out? Decide based on follower counts.',
      'What does the precomputed feed store: full posts or only IDs? Where is it cached?',
      'Ranking: which signals, and when is the score computed (at write, at read, or both)?',
    ],
  },
  '/hld/notification-system': {
    prompt: 'Design a notification service that other teams use to send push, SMS and email notifications.',
    requirements: [
      'One API to send a notification through push (iOS and Android), SMS and email',
      'Respect user preferences and opt-outs',
      'Millions of notifications a day, with spikes during campaigns',
      'At-least-once delivery without spamming users with duplicates',
      'Track delivery status and retry failures',
    ],
    hints: [
      'Why put a queue between the API and the channel workers, and should each channel get its own queue?',
      'How do you deduplicate, rate-limit per user and handle provider outages (APNs, FCM, SMS gateways)?',
      'Where do templates and user preferences live, and when are they applied?',
    ],
  },
  '/hld/netflix': {
    prompt: 'Design Netflix: subscribers browse a catalog and stream video on any device with minimal buffering.',
    requirements: [
      'Stream video in several resolutions, adapting to the viewer\'s bandwidth',
      'Personalised home page and recommendations',
      'Over 200 million subscribers, with peaks every evening',
      'Very high availability: playback keeps working when parts of the backend fail',
      'Resume playback across devices',
    ],
    hints: [
      'Separate the control plane (browse, auth, recommendations) from the data plane (video bytes). Where does each run?',
      'What happens to a video between upload and playback? Think encoding ladders and chunks.',
      'How do you get video close to viewers, and what does adaptive bitrate streaming need from the client?',
    ],
  },
  '/hld/youtube': {
    prompt: 'Design YouTube: anyone can upload videos, and billions of viewers watch, search and get recommendations.',
    requirements: [
      'Upload large videos reliably, including over poor connections',
      'Videos playable in several resolutions shortly after upload',
      'Search, view counts, likes and comments',
      'Hundreds of hours uploaded every minute; billions of daily views',
      'Popular videos must not overload origin storage',
    ],
    hints: [
      'How do you make large uploads resumable, and what pipeline runs after upload?',
      'Where do view counts go? An exact counter per view will not survive this load.',
      'Long tail vs viral: how do CDN caching and storage tiers differ for each?',
    ],
  },
  '/hld/uber': {
    prompt: 'Design Uber: match riders with nearby drivers and track the trip in real time.',
    requirements: [
      'Drivers send their location every few seconds',
      'A rider requests a ride and is matched with a nearby available driver within seconds',
      'Both sides see live location during the trip',
      'Price with surge based on supply and demand per area',
      'Millions of drivers across thousands of cities',
    ],
    hints: [
      'How do you index locations so "drivers near this point" is fast? Compare geohash, quadtree and hexagonal grids.',
      'Location updates are a huge write stream. Do they need a durable database, or does an in-memory store do?',
      'How do you make sure one driver is not matched to two riders at the same moment?',
    ],
  },
  '/hld/amazon': {
    prompt: 'Design the core of an e-commerce site like Amazon: catalog, search, cart, checkout and orders.',
    requirements: [
      'Browse and search a catalog of hundreds of millions of products',
      'Add to cart; the cart survives across devices',
      'Checkout reserves inventory, takes payment and creates an order',
      'Never oversell limited stock, even during a flash sale',
      'Order tracking and notifications',
    ],
    hints: [
      'Which parts need strong consistency (inventory, payment) and which can be eventually consistent (catalog, reviews)?',
      'How is checkout a distributed transaction across inventory, payment and orders? Consider a saga.',
      'How do you handle a hot product that 1 million people try to buy in the same minute?',
    ],
  },
  '/hld/stripe': {
    prompt: 'Design a payments API like Stripe that merchants call to charge cards.',
    requirements: [
      'Create a charge against a card through an external card network',
      'A network timeout or client retry must never charge the customer twice',
      'Every money movement is recorded and auditable',
      'Very high availability; merchants depend on it for revenue',
      'Notify merchants of payment events through webhooks',
    ],
    hints: [
      'How do idempotency keys work, and where are they stored and checked?',
      'Model the money with a double-entry ledger. Why is it append-only?',
      'What do you do when the card network times out and you do not know if the charge went through?',
    ],
  },
  '/hld/coinbase': {
    prompt: 'Design a crypto exchange like Coinbase: users deposit, trade and withdraw cryptocurrency.',
    requirements: [
      'Place market and limit orders; match buy and sell orders',
      'Balances are always correct; no money is created or lost',
      'Deposits and withdrawals to blockchains, with the right number of confirmations',
      'Custody: most funds are kept in cold storage',
      'Survive extreme spikes when prices move fast',
    ],
    hints: [
      'What does an order book look like, and why is a matching engine usually single-threaded per trading pair?',
      'How do the ledger and the matching engine stay consistent?',
      'Hot wallet vs cold wallet: how much sits in each, and how are withdrawals approved?',
    ],
  },
  '/hld/google-docs': {
    prompt: 'Design Google Docs: several people edit the same document at once and see each other\'s changes live.',
    requirements: [
      'Concurrent editing with changes visible to others within about a second',
      'Everyone ends up with the same document, whatever order edits arrive in',
      'Cursors and presence of other editors',
      'Version history and restore',
      'Offline editing that merges when back online',
    ],
    hints: [
      'Compare operational transformation (OT) and CRDTs. Which needs a central server?',
      'How do edits flow between clients and the server, and how is a document\'s session assigned to a server?',
      'How do you store a document: snapshots, an operation log, or both?',
    ],
  },
  '/hld/google-drive': {
    prompt: 'Design Google Drive: store files in the cloud and keep them in sync across a user\'s devices.',
    requirements: [
      'Upload, download, rename, move and delete files and folders',
      'Sync changes to every device of the user, including after being offline',
      'Share files with other users with view or edit permissions',
      'Files up to many GB; uploads resume after interruption',
      'Storage cost matters at billions of files',
    ],
    hints: [
      'Why split files into chunks? Think resumable uploads, syncing only what changed, and deduplication.',
      'Separate file metadata from file content. What goes in each store?',
      'How does a device learn that something changed: polling, long polling or push?',
    ],
  },
  '/hld/dropbox-sign': {
    prompt: 'Design an e-signature service like Dropbox Sign: send a document, collect signatures, produce a legally valid signed PDF.',
    requirements: [
      'Upload a document, place signature fields and send to signers in order or in parallel',
      'Signers sign from email links without an account',
      'A tamper-evident audit trail of every action',
      'The final PDF cannot be modified without detection',
      'Reminders, expiry, and an API with webhooks for integrations',
    ],
    hints: [
      'Model the signing workflow as a state machine. What are the states and transitions?',
      'How do you make the audit trail tamper-evident (hashing, append-only storage)?',
      'PDF processing is slow and CPU heavy. How is it queued and scaled?',
    ],
  },
  '/hld/chess-com': {
    prompt: 'Design an online chess platform like Chess.com with real-time games and matchmaking.',
    requirements: [
      'Match players of similar rating within seconds',
      'Real-time moves with clocks that are fair to both players',
      'Millions of concurrent games',
      'Reconnect to a game after a network drop',
      'Detect cheating with chess engines',
    ],
    hints: [
      'How does matchmaking work: one global queue, or rating buckets that widen over time?',
      'Where does a live game\'s state live, and how do both players connect to it?',
      'Who keeps the authoritative clock, and how do you account for network lag?',
    ],
  },
  '/hld/leetcode': {
    prompt: 'Design LeetCode: users submit code that is compiled, run against test cases and judged.',
    requirements: [
      'Run submitted code in many languages against hidden test cases',
      'Untrusted code must not escape, read other users\' data or exhaust resources',
      'Results return within a few seconds',
      'Contests with tens of thousands of users submitting in the same minutes',
      'Leaderboards during contests',
    ],
    hints: [
      'How do you isolate untrusted code: containers, gVisor, microVMs? What limits do you set?',
      'Why does a queue sit between submission and execution, and how do you scale workers for a contest spike?',
      'How do you build a live contest leaderboard cheaply?',
    ],
  },
  '/hld/ticket-booking': {
    prompt: 'Design a ticket booking system like BookMyShow for movies and concerts.',
    requirements: [
      'Browse shows and see a live seat map',
      'Select seats and hold them while the user pays',
      'Two users can never book the same seat',
      'Huge spikes when a popular concert opens for sale',
      'Unpaid holds expire and the seats return to sale',
    ],
    hints: [
      'How do you hold a seat for a few minutes: a row lock, a status with an expiry, or a cache key with TTL?',
      'Optimistic or pessimistic concurrency for seat selection? Which suits a hot show?',
      'How would a virtual waiting room protect the system when a million people arrive at once?',
    ],
  },
};
