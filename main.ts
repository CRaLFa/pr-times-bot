import '@std/dotenv/load';
import { ChannelTypes, createBot, Intents, startBot } from 'https://deno.land/x/discordeno@18.0.1/mod.ts';

const TOKEN_ENV_KEY = 'BOT_TOKEN';
const KV_KEY = ['prtimes', 'lastTime'];

(() => {
  if (!Deno.env.has(TOKEN_ENV_KEY)) {
    console.error(`Environment variable '${TOKEN_ENV_KEY}' is not set`);
    Deno.exit(1);
  }

  const bot = createBot({
    token: Deno.env.get(TOKEN_ENV_KEY)!,
    intents: Intents.Guilds | Intents.GuildMessages,
  });

  const getTextChannelIds = async (guildIds: bigint[]) => {
    const channelCollections = await Promise.all(guildIds.map((guildId) => bot.helpers.getChannels(guildId)));
    const channels = channelCollections.flatMap((collection) => [...collection.values()]);
    return channels
      .filter((chan) => chan.type === ChannelTypes.GuildText && chan.name === '一般')
      .map((chan) => chan.id);
  };

  const main = async (channelIds: bigint[]) => {
    const kv = await Deno.openKv();
    // await kv.delete(KV_KEY);
    // const lastTime = (await kv.get<number>(KV_KEY)).value ?? 0;
  };

  new Promise<bigint[]>((resolve) => {
    bot.events.ready = (_, payload) => {
      console.log(`Logged in as ${payload.user.username}`);
      resolve(payload.guilds);
    };
    startBot(bot);
  }).then(async (guildIds) => {
    const channelIds = await getTextChannelIds(guildIds);
    Deno.cron('pr-times-bot', {
      minute: { every: 1 },
    }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      await main(channelIds);
    });
  }).catch((err) => {
    console.error(err);
    Deno.exit(1);
  });
})();
