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

  const getTextChannelIds = async (guildIds: bigint[]) => {
    const channelCollections = await Promise.all(guildIds.map((guildId) => bot.helpers.getChannels(guildId)));
    const channels = channelCollections.flatMap((collection) => [...collection.values()]);
    return channels.filter((chan) => chan.type === ChannelTypes.GuildText && chan.name === '一般').map((chan) => chan.id);
  };

  const fetchRss = async () => {
    const response = await fetch(RSS_URL);
    const xml = await response.text();
    return parseFeed(xml);
  };

  const processRss = async (channelIds: bigint[]) => {
    const feed = await fetchRss();
    // await kv.delete(KV_KEY);
    const lastPublished = (await kv.get<number>(KV_KEY)).value ?? 0;
    const newAiEntries = feed.entries.filter((entry) => lastPublished < Date.parse(entry.publishedRaw!) && /(^|\W)(AI|ＡＩ)\W/.test(entry.title?.value!));
    if (newAiEntries.length < 1) {
      console.log('No new entry about AI');
      return;
    }
    for (const entry of newAiEntries) {
      const published = new Date(entry.publishedRaw!).toLocaleString();
      for (const channelId of channelIds) {
        await bot.helpers.sendMessage(channelId, {
          content: `${entry.title?.value} (${published})\n${entry.links[0].href}`,
        });
      }
    }
    await kv.set(KV_KEY, Date.parse(feed.publishedRaw!));
  };

  new Promise<bigint[]>((resolve) => {
    bot.events.ready = (_, payload) => {
      console.log(`Logged in as ${payload.user.username}`);
      resolve(payload.guilds);
    };
    startBot(bot);
  }).then(async (guildIds) => {
    const channelIds = await getTextChannelIds(guildIds);
    // return processRss(channelIds);
    return Deno.cron('PR-TIMES-RSS', { minute: { exact: [16, 18, 20, 46, 48, 50] } }, () => processRss(channelIds));
  });

})();
