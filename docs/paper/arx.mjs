// arXiv 查询小工具：node arx.mjs "标签@@查询或 id_list:xxxx@@条数" ...
import https from 'node:https';
const get = q => new Promise(res => https.get(q, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }));
const parse = x => [...x.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => ({
  id: (m[1].match(/abs\/([\d.v]+)</) || [])[1],
  title: (m[1].match(/<title>([\s\S]*?)<\/title>/) || [])[1].replace(/\s+/g, ' ').trim(),
  date: (m[1].match(/<published>([\d-]+)/) || [])[1],
  authors: [...m[1].matchAll(/<name>([^<]+)<\/name>/g)].map(a => a[1]).slice(0, 6).join(', '),
  abs: (m[1].match(/<summary>([\s\S]*?)<\/summary>/) || [])[1].replace(/\s+/g, ' ').trim().slice(0, 1200),
}));
for (const s of process.argv.slice(2)) {
  const [label, query, n = '4'] = s.split('@@');
  const q = query.startsWith('id_list:') ? query : 'search_query=' + encodeURIComponent(query).replace(/%20/g, '+');
  console.log('\n##### ' + label);
  const x = await get('https://export.arxiv.org/api/query?' + q + '&sortBy=relevance&max_results=' + n);
  for (const e of parse(x)) console.log(`[${e.id}] ${e.date}  ${e.title}\n  作者: ${e.authors}\n  ${e.abs}\n`);
}
