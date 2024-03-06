import 'https://deno.land/std@0.218.2/dotenv/load.ts';
import { createBot, startBot, Intents, ChannelTypes } from 'https://deno.land/x/discordeno@18.0.1/mod.ts';
import { parseFeed } from 'https://deno.land/x/rss@1.0.1/mod.ts';

const RSS_URL = 'https://prtimes.jp/index.rdf';
const KV_KEY = ['PR-TIMES-RSS', 'AI', 'published'];

(async () => {

  const kv = await Deno.openKv();

  const bot = createBot({
    token: Deno.env.get('BOT_TOKEN')!,
    intents: Intents.Guilds | Intents.GuildMessages,
  });

  const fetchRss = async () => {
    const response = await fetch(RSS_URL);
    const xml = await response.text();
    return parseFeed(xml);
  };

  const processRss = async (channelId: bigint) => {
    const feed = await fetchRss();
    // await kv.delete(KV_KEY);
    const lastPublished = (await kv.get<number>(KV_KEY)).value ?? 0;
    const newAiFeeds = feed.entries.filter((entry) => lastPublished < Date.parse(entry.publishedRaw!) && /\W(AI|ＡＩ)\W/.test(entry.title?.value!));
    if (newAiFeeds.length === 0)
      return;
    for (const entry of newAiFeeds) {
      const published = new Date(entry.publishedRaw!).toLocaleString();
      await bot.helpers.sendMessage(channelId, {
        content: `${entry.title?.value} (${published})\n${entry.links[0].href}`,
      });
    }
    await kv.set(KV_KEY, Date.parse(feed.publishedRaw!));
  };

  new Promise<bigint>((resolve) => {
    bot.events.ready = (_, payload) => {
      console.log(`Logged in as ${payload.user.username}`);
      resolve(payload.guilds[0]);
    };
    startBot(bot);
  }).then(async (guildId) => {
    const channels = await bot.helpers.getChannels(guildId);
    const channelId = channels.find((channel) => channel.type === ChannelTypes.GuildText && channel.name === '一般')!.id;
    // return processRss(channelId);
    Deno.cron('PR-TIMES-RSS', { minute: { every: 5 } }, () => processRss(channelId));
  });

})();
