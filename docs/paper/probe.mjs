// 用 arXiv API 抓标题/作者/摘要，便于核对论文是否真实存在及其内容
// 用法：node probe.mjs "标签@@ti:\"...\"@@5" "JEPA-Anything@@id_list:2609.20800@@1"
import https from 'node:https';
const get = q => new Promise(res => https.get(q, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }));
const parse = x => [...x.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => ({
  id: (m[1].match(/abs\/([\d.v]+)</) || [])[1],
  title: (m[1].match(/<title>([\s\S]*?)<\/title>/) || [])[1].replace(/\s+/g, ' ').trim(),
  date: (m[1].match(/<published>([\d-]+)/) || [])[1],
  updated: (m[1].match(/<updated>([\d-]+)/) || [])[1],
  authors: [...m[1].matchAll(/<name>([^<]+)<\/name>/g)].map(a => a[1]),
  abs: (m[1].match(/<summary>([\s\S]*?)<\/summary>/) || [])[1].replace(/\s+/g, ' ').trim(),
}));
for (const s of process.argv.slice(2)) {
  const [label, query, n = '4'] = s.split('@@');
  const q = query.startsWith('id_list:') ? query : 'search_query=' + encodeURIComponent(query).replace(/%20/g, '+');
  console.log('\n##### ' + label);
  const x = await get('https://export.arxiv.org/api/query?' + q + '&sortBy=relevance&max_results=' + n);
  for (const e of parse(x)) {
    console.log(`[${e.id}] 首发 ${e.date} / 更新 ${e.updated}`);
    console.log('  ' + e.title);
    console.log(`  作者(${e.authors.length}): ${e.authors.slice(0, 5).join(', ')}${e.authors.length > 5 ? ' …' : ''}`);
    console.log('  ' + e.abs.slice(0, 1100) + '\n');
  }
}
