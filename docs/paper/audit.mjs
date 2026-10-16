// 合订本机械审计
import fs from 'node:fs';
const DOC = 'D:/科研/worldmodel/docs/';
const doc = fs.readFileSync(DOC + 'Cosmos3-中文全译.md', 'utf8');
const spine = ['00-part0.md', '01-1-Introduction.md', '02-2-Model-Architecture.md', '03-3-Data.md',
  '04-4-Training.md', '05-5-Infrastructure.md', '06-6-Results.md', '07-7-Related-Work.md', '08-8-Conclusion.md'];
const src = spine.map(f => fs.readFileSync(DOC + 'paper/en/' + f, 'utf8')).join('\n\n');

const stripFn = s => s.replace(/〔脚注[^〕]*〕/g, '');
const norm = s => stripFn(s).replace(/^(\s*\d+\.\s*)+/, '').replace(/[*_`$\\{}()\[\]#>]/g, '')
  .replace(/[，。、．.;：:]/g, '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 60);
const blocks = t => t.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
const SB = blocks(src), DB = blocks(doc);
const dset = new Set(DB.map(norm));

const lost = [];
for (const b of SB) {
  if (/^####\s*(Abstract|Contents)$/.test(b)) continue;
  if (/^\d+\.\s/.test(b) && /(Encoders|Contributors|Caption Details|Upsampler)/.test(b)) continue;
  if (!dset.has(norm(b))) lost.push(b.replace(/\n/g, ' ').slice(0, 100));
}

const tbls = DB.filter(b => b.startsWith('|'));
const tblIssues = [];
for (const t of tbls) {
  const L = t.split('\n').filter(l => l.startsWith('|'));
  const w = L.map(l => l.split('|').length - 2);
  if (new Set(w).size > 1) tblIssues.push('列数不齐 ' + [...new Set(w)].join('/') + ' :: ' + L[0].slice(0, 60));
  if (L.length < 3) tblIssues.push('表过小(' + L.length + '行) :: ' + L[0].slice(0, 50));
  if (L.length > 2 && w[1] !== w[0]) tblIssues.push('分隔行列数不符 :: ' + L[0].slice(0, 50));
}

const imgLines = doc.split('\n').filter(l => /^!\[[^\]]*\]\(figures\//.test(l));
const files = imgLines.map(l => (l.match(/\(([^)]+)\)/) || [])[1] || '');
const dupImg = files.filter((x, i) => files.indexOf(x) !== i);
const missing = files.map(f => f.replace('figures/', '')).filter(f => !fs.existsSync(DOC + 'figures/' + f));
const imgNums = [...new Set([...doc.matchAll(/^!\[Figure ([0-9]+)/gm)].map(m => +m[1]))].sort((a, b) => a - b);
const capF = [...new Set([...doc.matchAll(/^> Figure ([0-9]+)/gm)].map(m => +m[1]))].sort((a, b) => a - b);
const capT = [...new Set([...doc.matchAll(/^> Table ([0-9]+)/gm)].map(m => +m[1]))].sort((a, b) => a - b);

const residue = {
  sub标签: (doc.match(/<sub>/g) || []).length,
  警告符: (doc.match(/⚠/g) || []).length,
  未匹配标注: (doc.match(/未匹配到既有译文/g) || []).length,
  undefined: (doc.match(/undefined/g) || []).length,
  NaN: (doc.match(/NaN/g) || []).length,
  纯英文长块: DB.filter(b => b.length > 140 && !/[\u4e00-\u9fa5]/.test(b) && !/^\$\$|^\||^!\[|^> |^#{1,6}/.test(b)).length,
};
const cnt = new Map();
for (const b of DB) { if (b.length < 60 || /^\|/.test(b)) continue; const k = norm(b); cnt.set(k, (cnt.get(k) || 0) + 1); }
const dups = [...cnt.entries()].filter(([, v]) => v > 1);

/* 中英对照下"按文本追溯散文"没有意义（源是英文、文档是中文），这里改为按元素类型对齐计数。
   散文命中/未命中的权威口径由 merge5.mjs 自己统计并写进文档末尾「合并校验」。 */
const count = (s, re) => (s.match(re) || []).length;
const parity = {
  图片行: [count(src, /^!\[/gm), count(doc, /^!\[/gm)],
  表题: [count(src, /^> Table /gm), count(doc, /^> Table /gm)],
  图题: [count(src, /^> Figure /gm), count(doc, /^> Figure /gm)],
  独立公式: [count(src, /^\$\$/gm), count(doc, /^\$\$/gm)],
  引用括号: [count(src, /\([A-Z][^()]{3,90}(19|20)\d{2}[a-z]?\)/g), count(doc, /\([A-Z][^()]{3,90}(19|20)\d{2}[a-z]?\)/g)],
  列表项: [count(src, /^(- |\d+\. )/gm), count(doc, /^(- |\d+\. )/gm)],
};
const parityBad = Object.entries(parity).filter(([, [a, b]]) => a !== b);
console.log(JSON.stringify({
  srcBlocks: SB.length, docBlocks: DB.length,
  类型计数对齐: Object.fromEntries(Object.entries(parity).map(([k, v]) => [k, v.join('/')])),
  不一致项: parityBad.map(([k, [a, b]]) => `${k} 源${a} vs 文${b}`),
  表格问题: tblIssues.length, 表格问题明细: tblIssues.slice(0, 6),
  图片行: imgLines.length, 图片缺失: missing.length, 图片重复: dupImg.length,
  有题无图: capF.filter(c => !imgNums.includes(c)),
  残留: residue, 重复段落块: dups.length, 重复样例: dups.slice(0, 3).map(([k, v]) => v + '× ' + k.slice(0, 40)),
}, null, 1));
