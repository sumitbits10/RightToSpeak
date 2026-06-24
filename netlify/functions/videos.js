exports.handler = async function () {
  const CHANNEL_ID = 'UCr8WLAYrP78cqvCtmGXOKTA';
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

  try {
    const res = await fetch(rssUrl);
    if (!res.ok) throw new Error(`YouTube RSS returned ${res.status}`);
    const xml = await res.text();

    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => {
      const entry = m[1];
      const videoId    = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)            || [])[1] || '';
      const title      = (entry.match(/<title>(.*?)<\/title>/)                       || [])[1] || '';
      const published  = (entry.match(/<published>(.*?)<\/published>/)               || [])[1] || '';
      const description= (entry.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || '';
      return { videoId, title, published, description };
    }).filter(v => v.videoId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(entries),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
