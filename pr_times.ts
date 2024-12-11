type SearchResult = {
  articles: {
    id: number;
    title: string;
    url: string;
    provider: {
      id: number;
      name: string;
      name_origin: string;
      url: string;
    };
    images: {
      original: {
        file: string;
      };
    };
    updated_at: {
      origin: string;
      time_iso_8601: string;
    };
    new_flg: boolean;
    text: string;
    aprilfool_type: number;
  }[];
  page: number;
};

type Entry = {
  time: string;
  stockCode?: string;
  companyName: string;
  title: string;
  pageUrl: string;
  imageUrl: string;
};

type PressRelease = {
  latestEntryTime: number;
  entries: Entry[];
};

const BASE_URL = 'https://prtimes.jp';
const SEARCH_URL = `${BASE_URL}/api/search_release.php?callback=addReleaseList&type=searchcorpcate&v=001`;

const getNumYmdhm = (timeISO8601: string) => {
  const d = new Date(timeISO8601);
  return d.getFullYear() * 100000000 +
    (d.getMonth() + 1) * 1000000 +
    d.getDate() * 10000 +
    d.getHours() * 100 +
    d.getMinutes();
};

const formatYmdhm = (timeISO8601: string) =>
  timeISO8601.replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}).+$/, '$1/$2/$3 $4');

const searchPressRelease = async (lastTime: number, searchCond: RegExp) => {
  const release: PressRelease = {
    latestEntryTime: 0,
    entries: [],
  };
  let page = 1;
  try {
    while (true) {
      const res = await fetch(`${SEARCH_URL}&page=${1}&limit=40`);
      if (!res.ok) {
        return release;
      }
      const body = await res.text();
      const sr: SearchResult = JSON.parse(body.replaceAll(/^addReleaseList\((.+)\)$/g, '$1'));
      if (sr.articles.length < 1) {
        return release;
      }
      if (page === 1) {
        release.latestEntryTime = getNumYmdhm(sr.articles[0].updated_at.time_iso_8601);
      }
      const matchedEntries: Entry[] = sr.articles.filter((article) =>
        lastTime < getNumYmdhm(article.updated_at.time_iso_8601) && searchCond.test(article.title)
      ).map((article) => ({
        time: formatYmdhm(article.updated_at.time_iso_8601),
        companyName: article.provider.name_origin,
        title: article.title,
        pageUrl: BASE_URL + article.url,
        imageUrl: BASE_URL + article.images.original.file,
      }));
      release.entries.push(...matchedEntries);
      if (getNumYmdhm(sr.articles.at(-1)!.updated_at.time_iso_8601) <= lastTime) {
        return release;
      }
      page++;
    }
  } catch (err) {
    console.error(err);
    return release;
  }
};

export { searchPressRelease };
