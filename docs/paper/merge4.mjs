// 合并器 v4：规范源（修复后的 arXiv HTML 提取）为骨架 + 八路分章译文按内容回填
// 运行：node merge4.mjs
import fs from 'node:fs';
import path from 'node:path';

const DOC = 'D:/科研/worldmodel/docs';
const OLD = path.join(DOC, 'paper/old-en-superseded');  // 译者当初依据的提取版
const NEW = path.join(DOC, 'paper/en');                // 规范源（colspan/span 表格、嵌套浮动面、脚注已修复）
const ZH = path.join(DOC, 'paper/zh');
const OUT = path.join(DOC, 'Cosmos3-中文全译.md');

// 译文文件 ↔ 它翻译的旧源（§6 按旧源行号一分为二：6.2.4 起于旧源第 237 行）
const PAIRS = [
  { zh: 'A-摘要-§1引言-§8结论.md', old: ['00-part0.md', '01-1-Introduction.md', '08-8-Conclusion.md'] },
  { zh: 'B-§2-模型架构.md', old: ['02-2-Model-Architecture.md'] },
  { zh: 'C-§3-数据.md', old: ['03-3-Data.md'] },
  { zh: 'D-§4-训练.md', old: ['04-4-Training.md'] },
  { zh: 'E-§5-基础设施.md', old: ['05-5-Infrastructure.md'] },
  { zh: 'G-§6-结果-上.md', old: ['06-6-Results.md'], range: [1, 236] },
  { zh: 'H-§6-结果-下.md', old: ['06-6-Results.md'], range: [237, 99999] },
  { zh: 'F-§7-相关工作.md', old: ['07-7-Related-Work.md'] },
];
const SPINE = ['00-part0.md', '01-1-Introduction.md', '02-2-Model-Architecture.md', '03-3-Data.md',
  '04-4-Training.md', '05-5-Infrastructure.md', '06-6-Results.md', '07-7-Related-Work.md', '08-8-Conclusion.md'];

const isTable = b => { const L = b.split('\n').filter(l => l.trim()); return L.length > 1 && L.every(l => l.startsWith('|')); };
const isImg = b => /^!\[/.test(b);
const isCap = b => /^>\s*(Table|Figure)\s/.test(b);
const isHead = b => /^#{1,6}\s/.test(b);
const stripFn = s => s.replace(/〔脚注[^〕]*〕/g, ' ');
// 归一化：去列表编号（LaTeXML 的 li 文本自带编号，新旧提取编号位数不同）、去脚注、去标点与空白
const norm = s => stripFn(s).replace(/^(\s*\d+\.\s*)+/, '').replace(/^[•\-\s]+/, '')
  .replace(/[\*_`$\\{}()\[\]#>]/g, '').replace(/[，。、．.;：:]/g, '')
  .replace(/[　\s]+/g, ' ').trim().toLowerCase().slice(0, 70);

// 新源里独有、旧提取没有的短句（嵌套浮动面的子图题等）——人工给定中文
const MANUAL = new Map(Object.entries({
  '> (a) Synergy between AgiBot and Egocentric motion.': '（a）AgiBot 与第一人称运动之间的协同。',
  '> (b) AgiBot benefits from Egocentric warmup.': '（b）AgiBot 受益于第一人称数据的预热。',
  '> Figure 9: **Action data distribution. Hours are aggregated over the four main action-data pillars in the final curated action mid-training set, which contains 8.4M episodes and 61.3K hours.**':
    '> Figure 9: **动作数据分布。小时数在最终清洗的动作中期训练集的四个主要动作数据支柱上聚合；该集合包含 $8.4$M 个 episode 与 $61.3$K 小时。**',
  '> Table 4: **Robotics data breakdown. Grouped by robot embodiment.**':
    '> Table 4: **机器人学数据细分。按机器人本体形态（robot embodiment）分组。**',
  // A 那份译文不含小标题，标题由此处直接给定（避免 §1 段落错位一格）
  '# 1 Introduction': '# 1 引言（Introduction）',
  '# 8 Conclusion': '# 8 结论（Conclusion）',
  '#### Abstract': '## 摘要（Abstract）',
}));
const MAN2 = new Map([...MANUAL.entries()].map(([k,v]) => [norm(k), v]));

// 脚注（HTML 里只有 1 条）——手工给定中文，位置随原句
const FOOTNOTE_ZH = {
  'We found that the public PAIBench-G Image-to-Video leaderboard results (judged by Qwen3-VL-235B-A22B) were not reproducible.':
    '我们发现公开的 PAIBench-G 图生视频榜单结果（由 Qwen3-VL-235B-A22B 判分）不可复现。',
};
function zhFootnotes(s) {
  return s.replace(/〔脚注(\d*)：([^〕]*)〕/g, (m, n, body) => {
    const k = Object.keys(FOOTNOTE_ZH).find(x => body.includes(x));
    return `〔脚注${n}：${k ? FOOTNOTE_ZH[k] : body}〕`;
  });
}

function readBlocks(p) {
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  const out = []; let cur = [], start = 1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') { if (cur.length) { out.push({ text: cur.join('\n'), line: start }); cur = []; } }
    else { if (!cur.length) start = i + 1; cur.push(lines[i]); }
  }
  if (cur.length) out.push({ text: cur.join('\n'), line: start });
  return out;
}
const segs = bs => { const o = [[]]; for (const b of bs) { if (isHead(b.text)) o.push([]); o[o.length - 1].push(b); } return o; };

/* ---------- 1. 配对：标题与散文分别按序号对齐，并做数字一致性自检 ---------- */
const dict = new Map();
const notesB = new Map();
const pairReport = [];
const samples = [];
const flatOf = t => t.replace(/\s+/g, ' ').trim().slice(0, 70);
// 数字比对：剥掉 LaTeX 与千分位逗号后取数字串（$3{,}346$ 与 3,346 归一为同一 token）
const numTokens = t => (String(t).replace(/[$\\{},\s]/g, '').match(/\d+(?:\.\d+)?/g) || []);
const pairsOk = (src, tr) => { const a = numTokens(src); if (a.length < 3) return true; const b = new Set(numTokens(tr)); return a.filter(x => b.has(x)).length / a.length >= 0.55; };
// 旧提取的噪声块不参与配对：图内标注被拆成的独立公式块、图内文字、表格说明、HTML 的 Abstract/Contents 壳
const isJunk = t => /^\$\$[\s\S]*\$\$$/.test(t.trim()) || /^(※|图内文字)/.test(t.trim()) || /^#{1,6}\s*(Abstract|Contents)$/.test(t.trim());

for (const { zh, old, range } of PAIRS) {
  const zp = path.join(ZH, zh);
  if (!fs.existsSync(zp)) { pairReport.push(zh + ': 文件缺失'); continue; }
  let ob = [];
  for (const f of old) { const p = path.join(OLD, f); if (fs.existsSync(p)) ob = ob.concat(readBlocks(p).filter(b => !range || (b.line >= range[0] && b.line <= range[1]))); }
  ob = ob.filter(b => !isJunk(b.text));
  const allB = readBlocks(zp);
  const nIdx = allB.findIndex(b => /^#{1,6}[ \t]*(译校说明|本章内部不一致|译者补注|译注)/.test(b.text));
  notesB.set(zh, nIdx >= 0 ? allB.slice(nIdx) : []);
  let zb = allB
    .filter(b => !/^#{1,6}\s*(译校说明|本章内部不一致|译者补注|译注|合并校验|目录|未命中清单|分章配对)/.test(b.text))
    .filter(b => !/^---$/.test(b.text.trim()) && !isJunk(b.text));
  const oH = ob.filter(b => isHead(b.text)), zH = zb.filter(b => isHead(b.text));
  const oP = ob.filter(b => !isHead(b.text) && !isTable(b.text) && !isImg(b.text));
  const zP = zb.filter(b => !isHead(b.text) && !isTable(b.text) && !isImg(b.text));
  let hHit = 0, pHit = 0, bad = 0;
  for (let i = 0; i < Math.min(oH.length, zH.length); i++) { const k = norm(oH[i].text); if (k && !dict.has(k)) { dict.set(k, zH[i].text); hHit++; } }
  for (let i = 0; i < Math.min(oP.length, zP.length); i++) {
    const k = norm(oP[i].text); if (!k || dict.has(k)) continue;
    if (!pairsOk(oP[i].text, zP[i].text)) { bad++; samples.push(zh + ' 第' + (i + 1) + '段 数字不符 | 源: ' + flatOf(oP[i].text) + ' | 译: ' + flatOf(zP[i].text)); continue; }
    dict.set(k, zP[i].text); pHit++;
  }
  pairReport.push(`${zh}: 标题 ${oH.length}/${zH.length} 配 ${hHit}；散文 ${oP.length}/${zP.length} 配 ${pHit}，数字自检剔除 ${bad}`);
}
fs.writeFileSync(path.join(DOC, 'paper/pair-audit.txt'), samples.join('\n\n') || '（无异常）', 'utf8');

/* ---------- 2. 表头词典 ---------- */
const HEAD = {
  model: '模型', variant: '变体', type: '类型', mode: '模式', base: '基座', benchmark: '基准',
  capability: '能力', reasoning: '推理', generation: '生成', general: '通用', robotics: '机器人',
  driving: '驾驶', 'smart infra.': '智慧基建', audio: '音频', resolution: '分辨率', frames: '帧数',
  fps: '帧率', dimensions: '尺寸', tasks: '任务数', episodes: 'episode 数', hours: '小时数',
  'data source': '数据来源', embodiment: '本体形态', score: '分数', overall: '综合', metric: '指标',
  metrics: '指标', setting: '设置', value: '取值', stage: '阶段', 'llm layers': 'LLM 层数',
  'hidden dim': '隐维度', 'attn heads': '注意力头', 'kv heads': 'KV 头', 'head dim': '头维度',
  'ffn dim': 'FFN 维度', checkpoint: '检查点', description: '说明', demonstrates: '展示能力',
  workflow: '工作流', inputs: '输入', outputs: '输出', domain: '领域', quality: '质量',
  'image-level metrics': '图像级指标', 'open-sourced': '开源', 'closed-sourced': '闭源',
  'ground truth': '真实视频', step: '步骤', state: '状态', notes: '注', category: '类别',
  text2image: '文生图', text2video: '文生视频', image2video: '图生视频',
  'fd: robot': '前向动力学(机器人)', 'policy: robot': '策略(机器人)', 'pre-training': '预训练',
  'supervised fine tuning': '监督微调', 'supervised fine-tuning': '监督微调', total: '合计',
  'image-text': '图文', 'video-text': '视频-文本', 'text only': '纯文本', modality: '模态',
  'image and video': '图像与视频', 'video transfer': '视频转换', 'inverse dynamics': '逆向动力学',
  'forward dynamics': '前向动力学', policy: '策略', audio: '音频', video: '视频', image: '图像',
};
function zhHeaders(tbl) {
  return tbl.split('\n').map((l, i) => {
    if (i === 1 || !l.startsWith('|')) return l;
    return '|' + l.slice(1, -1).split('|').map(c => {
      const t = c.trim(); const bare = t.replace(/\*\*/g, '').trim().toLowerCase();
      return ' ' + (HEAD[bare] ? t.replace(new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), HEAD[bare]) : t) + ' ';
    }).join('|') + '|';
  }).join('\n');
}

/* ---------- 3. 以规范源为骨架输出 ---------- */
const out = [];
const missList = [];
let hit = 0, miss = 0, extractedNotes = 0, tbl = 0, img = 0, eq = 0, capHit = 0, capMiss = 0, headHit = 0, headMiss = 0, tocDrop = 0;

for (const f of SPINE) {
  const p = path.join(NEW, f);
  if (!fs.existsSync(p)) { out.push(`> ⚠ 规范源缺少 ${f}`); continue; }
  for (const b of readBlocks(p)) {
    const t = b.text;
    if (f === '00-part0.md' && /^\d+\.\s/.test(t)) { tocDrop++; continue; }   // HTML 目录残渣（正文另有中文目录）
    if (f === '00-part0.md' && /^\*\*作者：\*\*/.test(t)) { out.push('**作者：** NVIDIA Cosmos Team（贡献者名单与致谢见附录 G）'); continue; }
    if (isImg(t)) { img++; out.push(t); continue; }
    if (isTable(t)) { tbl++; out.push(zhHeaders(t)); continue; }
    if (/^(※|> ⚠|图内文字)/.test(t)) { extractedNotes++; out.push(t); continue; }   // 提取器的还原说明，属中文注释不计未译                     // 提取器为合并单元格生成的说明，不算未译
    if (/^\$\$[\s\S]*\$\$$/.test(t.trim())) { eq++; out.push(t.trim()); continue; }   // 独立公式：原样保留 LaTeX
    if (/^#{1,6}\s*Abstract$/.test(t.trim())) { out.push('## 摘要（Abstract）'); continue; }
    if (/^#{1,6}\s*Contents$/.test(t.trim()) || /^Contents$/.test(t.trim())) continue;
    const g = dict.get(norm(t)) || MANUAL.get(t.trim()) || MAN2.get(norm(t));
    const withFn = s => {
      const fns = t.match(/〔脚注[^〕]*〕/g) || [];
      if (!fns.length || /〔脚注/.test(s)) return s;
      return s + ' ' + zhFootnotes(fns.join(' '));
    };
    if (isCap(t)) { if (g) { capHit++; out.push(withFn(g)); } else { capMiss++; missList.push({ f, line: b.line, text: flatOf(t) }); out.push(t); } continue; }
    if (isHead(t)) { if (g) { headHit++; out.push(withFn(g)); } else { headMiss++; missList.push({ f, line: b.line, text: flatOf(t) }); out.push(t); } continue; }
    if (g) { hit++; out.push(withFn(g)); }
    else if (MANUAL.has(t.trim())) { hit++; out.push(MANUAL.get(t.trim())); }
    else { miss++; missList.push({ f, line: b.line, text: flatOf(t) }); out.push(t + '\n\n<sub>〔旧提取无此段，未匹配到既有译文：保留英文，待补〕</sub>'); }
  }
}

// 渲染层归一（只动 Markdown 标记，不动一个字的内容）：
//  · LaTeXML 把项目符写进了 li 文本 → "- • xxx" 变 "- xxx"
//  · 有序列表被写成 "1. 3. 标题" → 还原为 "3. 标题"
for (let i = 0; i < out.length; i++) {
  out[i] = out[i]
    .replace(/^- •[ \t]+/gm, '- ')
    .replace(/^(\d+)\.\s+\1\.\s+/m, '$1. ')
    .replace(/^(\d+)\.\s+(\d+)\.\s+/m, '$2. ');
}

const heads = out.filter(l => /^#{1,3} /.test(l)).map(l => { const m = l.match(/^(#{1,3})\s+(.*)$/); return { lv: m[1].length, t: m[2] }; });
const toc = '### 目录\n\n' + heads.filter(h => h.lv <= 2).map(h => (h.lv === 1 ? '- **' : '  - ') + h.t + (h.lv === 1 ? '**' : '')).join('\n') + '\n\n---\n\n';

const header = `# Cosmos 3：面向物理 AI 的全模态世界模型 —— 中文全译（1:1 结构还原）

> **原文**：*Cosmos 3: Omnimodal World Models for Physical AI*，NVIDIA Cosmos Team，2026-06-22，arXiv **2606.02800v4**（139 页）
> **骨架**：arXiv HTML（LaTeXML）解析结果。章节层级、图、表、公式、脚注一律按原文顺序与原位保留；表格的合并单元格由 colspan/span 解析器处理，非人工重建。
> **正文范围**：摘要 + §1–§8（附录 A–G 未译）。本文含正文图 ${img} 处、正文表 ${tbl} 块（Table 1–21；全文 33 张表，Table 22–33 属附录）、独立公式 ${eq} 条、脚注 1 条。全部 73 个图源已存于 \`docs/figures/\`（含 SVG）。
> **散文**：逐段中文全译。未能匹配到既有译文的句子保留英文并显式标注（见文末「合并校验」），不做猜测性补写。
> 原文 PDF：\`docs/cosmos3-technical-report.pdf\`；英文图文版：\`docs/paper/Cosmos3-英文原文图文版.md\`。

---

`;

const footer = `\n\n---\n\n## 合并校验\n\n- 散文：命中译文 **${hit}**，未命中 **${miss}**\n- 标题：命中 **${headHit}**，未命中 **${headMiss}**\n- 表题/图题：命中 **${capHit}**，未命中 **${capMiss}**\n- 表格块 **${tbl}**，图片行 **${img}**，独立公式 **${eq}** 条（原样 LaTeX），丢弃 HTML 目录残渣 **${tocDrop}** 块；提取器还原说明 **${extractedNotes}** 条（⚠ 内联图、合并单元格注）\n- 映射表条目 **${dict.size}**\n\n### 分章配对\n\n\`\`\`\n${pairReport.join('\n')}\n\`\`\`\n\n### 未命中清单（前 50 条）\n\n${missList.slice(0, 50).map(x => `- ${x.f}:${x.line}  ${x.text}`).join('\n') || '（无）'}\n`;

const notesSec = `\n\n---\n\n## 校注：本译本最终源相对各章译者当时所用版本的差异\n\n译者是分章并行开工的，他们依据的是提取器的早期版本；提取器随后修掉了四个吞内容缺陷，因此下列译注中若干"源文缺失"的抱怨在最终版里已不成立：\n\n1. **Table 4（机器人数据细分）表体已恢复**——它与 Figure 9 并排嵌在同一个 flex 容器里，早期解析在外层 figure 处停了脚。现表体 9 行 × 5 列，AgiBot 338 / 239.4K / 4.37K 等与 PDF 独立核对一致。\n2. **Table 10（推理器基准总表）表体已恢复**——它是 span 版表格（LaTeXML 用 \`span.ltx_tr\` 而非 \`<tr>\`），早期解析整表丢弃。现为 54 行 × 18 列。\n3. **Table 1 的列对齐已修正**——早期把 \`colspan\` 吞掉，导致 10 个列名相对数值整体左移一列；现在分组行"推理/生成"与列名行、数据行严格同列。\n4. **脚注 1 已内联**——即"公开 PAIBench-G 图生视频榜单（Qwen3-VL-235B-A22B 判分）不可复现"那条；早期解析把脚注整个跳过，所以 §6 译注里说"干净源不存在此脚注"，那是解析问题，不是原文没有。\n5. **Figure 9 的图片行、Figure 13 的图内表结构**等也在此轮修复中恢复。\n\n因此：G/H 两份译注里关于"表体缺失/脚注不存在"的条目请以上述为准；其余"源文自相矛盾"条目（Table 8 表题 GPU 数与正文不一致、Table 14 与正文 88.6/88.5、DreamZero 25.2% vs 表中 23.9、PAIBench-G 六域求和 1,033 vs 1,044、AVQ 公式用 AQ 而正文/表用 PQ 等）**均为原文自身问题，本译本一律照录未改**。\n` +
  [...notesB.entries()].filter(([, arr]) => arr.length)
  .map(([f, arr]) => `\n\n---\n\n## 附：${f} 的译注与源文不一致清单\n\n` + arr.map(b => b.text.replace(/^#{1,6}[ \t]*/, '#### ')).join('\n\n'))
  .join('');

fs.writeFileSync(OUT, header + toc + out.join('\n\n') + footer + notesSec, 'utf8');
console.log(JSON.stringify({
  out: OUT, bytes: fs.statSync(OUT).size, notesFiles: [...notesB.entries()].filter(([, a]) => a.length).length, dict: dict.size,
  prose: { hit, miss }, heads: { hit: headHit, miss: headMiss }, captions: { hit: capHit, miss: capMiss },
  tables: tbl, images: img, equations: eq, tocDrop, pairReport,
}, null, 2));
