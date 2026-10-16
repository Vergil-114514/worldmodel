// 合并分章中文译文 -> 单一可学习文档，并做结构完整性校验
// 用法：node merge.mjs
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/科研/worldmodel/docs';
const ZH = path.join(ROOT, 'paper/zh');
const EN = path.join(ROOT, 'paper/en');
const OUT = path.join(ROOT, 'Cosmos3-中文全译.md');

// 合并顺序：A 的摘要+§1 → B §2 → C §3 → D §4 → E §5 → G §6上 → H §6下 → F §7 → A 的 §8
const ORDER = ['A-摘要-§1引言-§8结论.md', 'B-§2-模型架构.md', 'C-§3-数据.md', 'D-§4-训练.md',
  'E-§5-基础设施.md', 'G-§6-结果-上.md', 'H-§6-结果-下.md', 'F-§7-相关工作.md'];

function read(f) { const p = path.join(ZH, f); if (!fs.existsSync(p)) throw new Error('缺文件 ' + p); return fs.readFileSync(p, 'utf8'); }

const parts = [];
let first = read(ORDER[0]);
// 把 §8 结论切出来放最后：按标题行匹配
const m = first.match(/^#{1,3}\s*8[\.、 ]?.*$/m);
let conclusion = '';
if (m) {
  const i = m.index;
  conclusion = first.slice(i);
  first = first.slice(0, i);
}
parts.push(first);
for (const f of ORDER.slice(1)) parts.push(read(f));
if (conclusion.trim()) parts.push(conclusion);

let body = parts.join('\n\n---\n\n').replace(/\n{3,}/g, '\n\n');

// 统计与校验
const stat = (s, re) => (s.match(re) || []).length;
const enSrc = fs.readdirSync(EN).filter(f => /^\d\d-(?!.*References)/.test(f) && f !== 'ALL-english.md')
  .map(f => fs.readFileSync(path.join(EN, f), 'utf8')).join('\n');
const rep = {
  '中文文档字符数': body.length,
  '中文图片行': stat(body, /^!\[.*\]\(figures\//gm), '英文源图片行': stat(enSrc, /^!\[.*\]\(figures\//gm),
  '中文 $$ 公式块': stat(body, /^\$\$.*\$\$$/gm) + stat(body, /\$\$[\s\S]*?\$\$/g) - stat(body, /^\$\$.*\$\$$/gm),
  '中文表格行': stat(body, /^\| /gm), '英文源表格行': stat(enSrc, /^\| /gm),
  '中文标题数': stat(body, /^#{1,4} /gm), '英文源标题数': stat(enSrc, /^#{1,4} /gm),
  '残留旧稿标记 ⟨': stat(body, /⟨/g),
};

const images = [...body.matchAll(/^!\[[^\]]*\]\(figures\/([^)]+)\)/gm)].map(x => x[1]);
const missing = images.filter(f => !fs.existsSync(path.join(ROOT, 'figures', f)));

const header = `# Cosmos 3：面向物理 AI 的全模态世界模型 —— 中文全译（1:1 结构还原）

> 原文：*Cosmos 3: Omnimodal World Models for Physical AI*，NVIDIA Cosmos Team，2026-06-22，arXiv **2606.02800v4**（139 页）
> 本译本由 arXiv HTML 版（LaTeXML）逐节解析后翻译，结构、图、表、公式与原文一一对应：
> 图 ${[...new Set(images)].length} 张（73 个图源已存于 \`figures/\`，含 SVG）；公式为原 LaTeX；表格列对齐取自 HTML，未做主观重建。
> 原文 PDF：\`cosmos3-technical-report.pdf\`；干净英文源：\`paper/en/ALL-english.md\`。

---

`;

fs.writeFileSync(OUT, header + body + '\n', 'utf8');
console.log('written:', OUT, fs.statSync(OUT).size, 'bytes');
console.log(JSON.stringify(rep, null, 2));
console.log('图片引用总数', images.length, '| 去重', new Set(images).size, '| 缺失文件', missing.length, missing.slice(0, 8));
