// 修正配对键冲突：整段归一化为主键，前缀仅在唯一时兜底；并统计冲突与错配风险
import fs from 'node:fs';
import path from 'node:path';

const DOC = 'D:/科研/worldmodel/docs';
const OLD = path.join(DOC, 'paper/old-en-superseded');   // 译者当初依据的提取版（散文对齐用）
const NEW = path.join(DOC, 'paper/en');                  // 规范源：表格/图片/公式的唯一依据
const ZH = path.join(DOC, 'paper/zh');
const OUT = path.join(DOC, 'Cosmos3-中文全译.md');

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
const base = s => stripFn(s).replace(/^(\s*\d+\.\s*)+/, '').replace(/^\s*(?:[-•*]\s*)+/g, '')
  .replace(/[*_`$\\{}()\[\]#>]/g, '').replace(/[，。、．.;：:]/g, '').replace(/[　\s]+/g, ' ').trim().toLowerCase();
const K = s => base(s);                                   // 整段主键
const KP = s => base(s).slice(0, 60);                     // 前缀兜底键
const flatOf = t => t.replace(/\s+/g, ' ').trim().slice(0, 70);
const numTokens = t => (String(t).replace(/[$\\{},\s]/g, '').match(/\d+(?:\.\d+)?/g) || []);
const pairsOk = (src, tr) => { const a = numTokens(src); if (a.length < 3) return true; const b = new Set(numTokens(tr)); return a.filter(x => b.has(x)).length / a.length >= 0.55; };
const isJunk = t => /^\$\$[\s\S]*\$\$$/.test(t.trim()) || /^(※|图内文字|> ⚠)/.test(t.trim()) || /^#{1,6}\s*(Abstract|Contents)$/.test(t.trim());

const MANUAL = new Map(Object.entries({
  '> Figure 9: **Action data distribution. Hours are aggregated over the four main action-data pillars in the final curated action mid-training set, which contains 8.4M episodes and 61.3K hours.**':
    '> Figure 9: **动作数据分布。小时数在最终清洗的动作中期训练集的四个主要动作数据支柱上聚合；该集合包含 $8.4$M 个 episode 与 $61.3$K 小时。**',
  '> Table 4: **Robotics data breakdown. Grouped by robot embodiment.**':
    '> Table 4: **机器人学数据细分。按机器人本体形态（robot embodiment）分组。**',
  '> (a) Synergy between AgiBot and Egocentric motion.': '（a）AgiBot 与第一人称运动之间的协同。',
  '> (b) AgiBot benefits from Egocentric warmup.': '（b）AgiBot 受益于第一人称数据的预热。',
  '> (a) Synergy between AgiBot and Egocentric motion.': '（a）AgiBot 与第一人称运动之间的协同。',
  '> (b) AgiBot benefits from Egocentric warmup.': '（b）AgiBot 受益于第一人称数据的预热。',
  '> Figure 9: **Action data distribution. Hours are aggregated over the four main action-data pillars in the final curated action mid-training set, which contains $8.4$M episodes and $61.3$K hours.**':
    '> Figure 9: **动作数据分布。小时数在最终清洗的动作中期训练集的四个主要动作数据支柱上聚合；该集合包含 $8.4$M 个 episode 与 $61.3$K 小时。**',
  '# 1 Introduction': '# 1 引言（Introduction）',
  '# 8 Conclusion': '# 8 结论（Conclusion）',
  '#### Abstract': '## 摘要（Abstract）',
}));

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

/* ---------- 配对 ---------- */
const dict = new Map();            // 整段键 → 译文
const byPrefix = new Map();        // 前缀键 → [整段键]
const notesB = new Map();
const pairReport = [], audits = [];
function put(srcText, zhText, tag) {
  const k = K(srcText); if (!k) return false;
  if (dict.has(k)) {
    if (dict.get(k) !== zhText) audits.push(`主键重复且译文不同 [${tag}] ${flatOf(srcText)}`);
    return false;
  }
  dict.set(k, zhText);
  const p = KP(srcText); if (!byPrefix.has(p)) byPrefix.set(p, []); byPrefix.get(p).push(k);
  return true;
}
for (const { zh, old, range } of PAIRS) {
  const zp = path.join(ZH, zh);
  if (!fs.existsSync(zp)) { pairReport.push(zh + ': 文件缺失'); continue; }
  let ob = [];
  for (const f of old) { const p = path.join(OLD, f); if (fs.existsSync(p)) ob = ob.concat(readBlocks(p).filter(b => !range || (b.line >= range[0] && b.line <= range[1]))); }
  ob = ob.filter(b => !isJunk(b.text));
  const allB = readBlocks(zp);
  const nIdx = allB.findIndex(b => /^#{1,6}[ \t]*(译校说明|本章内部不一致|译者补注|译注)/.test(b.text));
  notesB.set(zh, nIdx >= 0 ? allB.slice(nIdx) : []);
  const zb = allB.slice(0, nIdx >= 0 ? nIdx : allB.length)
    .filter(b => !/^---$/.test(b.text.trim()) && !isJunk(b.text));
  const oH = ob.filter(b => isHead(b.text)), zH = zb.filter(b => isHead(b.text));
  const oP = ob.filter(b => !isHead(b.text) && !isTable(b.text) && !isImg(b.text));
  const zP = zb.filter(b => !isHead(b.text) && !isTable(b.text) && !isImg(b.text));
  let h = 0, p = 0, bad = 0;
  for (let i = 0; i < Math.min(oH.length, zH.length); i++) if (put(oH[i].text, zH[i].text, zh + ' 标题' + i)) h++;
  for (let i = 0; i < Math.min(oP.length, zP.length); i++) {
    if (!pairsOk(oP[i].text, zP[i].text)) { bad++; audits.push(`数字自检失败 [${zh}] 源:${flatOf(oP[i].text)} ⇄ 译:${flatOf(zP[i].text)}`); continue; }
    if (put(oP[i].text, zP[i].text, zh + ' 段' + i)) p++;
  }
  pairReport.push(`${zh}: 标题 ${oH.length}/${zH.length}→${h}；散文 ${oP.length}/${zP.length}→${p}；自检剔除 ${bad}`);
}
// 前缀冲突统计（曾经导致 I2V 段被 T2I 段覆盖的那类问题）
const prefixCollisions = [...byPrefix.entries()].filter(([, v]) => v.length > 1);

const lookup = t => { const k = K(t); if (dict.has(k)) return dict.get(k);
  const m = MANUAL.get(t.trim()); if (m) return m;
  const p = KP(t); const lst = byPrefix.get(p);
  if (lst && lst.length === 1) return dict.get(lst[0]);
  for (const len of [120, 200, 320]) { const pre = K(t).slice(0, len); const cand = [...dict.keys()].filter(x => x.startsWith(pre)); if (cand.length === 1) return dict.get(cand[0]); if (cand.length > 1) break; }
  return null; };

/* ---------- 表头词典 ---------- */
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
  text2image: '文生图', text2video: '文生视频', image2video: '图生视频', 'fd: robot': '前向动力学(机器人)',
  'policy: robot': '策略(机器人)', 'pre-training': '预训练', 'supervised fine tuning': '监督微调',
  'supervised fine-tuning': '监督微调', total: '合计', 'image-text': '图文', 'video-text': '视频-文本',
  'text only': '纯文本', modality: '模态', 'image and video': '图像与视频', 'video transfer': '视频转换',
  'inverse dynamics': '逆向动力学', 'forward dynamics': '前向动力学', policy: '策略', video: '视频', image: '图像',
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

/* ---------- 脚注中文化 ---------- */
const FOOTNOTE_ZH = {
  'We found that the public PAIBench-G Image-to-Video leaderboard results (judged by Qwen3-VL-235B-A22B) were not reproducible.':
    '我们发现公开的 PAIBench-G 图生视频榜单结果（由 Qwen3-VL-235B-A22B 判分）不可复现。',
};
const zhFootnotes = s => s.replace(/〔脚注(\d*)：([^〕]*)〕/g, (m, n, body) => {
  const k = Object.keys(FOOTNOTE_ZH).find(x => body.includes(x));
  return `〔脚注${n}：${k ? FOOTNOTE_ZH[k] : body}〕`;
});

/* ---------- 输出 ---------- */
// 标题页的开源清单在 PDF 里是内联 SVG 图形（foreignObject 套 HTML 表），解析只能取到表格本体，
// 分组标签（Open-Source Code 等）随图形文字丢失。此处按条目名规则重建分组，并在「校注」中说明。
const GROUP = n => /^Cosmos-Framework$|^Cosmos$/.test(n) ? '开源代码'
  : /^Cosmos3-/.test(n) ? '开源权重检查点'
  : /^SDG-/.test(n) ? '开源合成数据集'
  : /^Cosmos-HUE/.test(n) ? '开源评测基准' : '其他';
function regroupResourceTables(blocks) {
  const rows = [];
  const keep = [];
  for (const b of blocks) {
    if (isTable(b.text) && /^[|] (Cosmos|Cosmos-Framework|Cosmos3-|SDG-|Cosmos-HUE)/m.test(b.text)) {
      b.text.split('\n').filter(l => l.startsWith('|')).slice(0, 1).concat(b.text.split('\n').filter(l => l.startsWith('|')).slice(2))
        .forEach(l => { const c = l.slice(1, -1).split('|').map(x => x.trim()); if (c.length >= 2 && c[0]) rows.push(c); });
      continue;                                    // 丢弃原碎片表
    }
    keep.push(b);
  }
  if (!rows.length) return { blocks, text: null };
  const tbl = ['| 分组 | 条目 | 地址 |', '|---|---|---|']
    .concat(rows.map(([n, u]) => `| ${GROUP(n)} | \`${n}\` | ${u} |`)).join('\n');
  return { blocks: keep, text: '> 标题页开源清单（PDF 中为内联图形，此处按条目名重建分组标签）：\n\n' + tbl };
}

let resourceRows = 0;
const out = [], missList = [];
let hit = 0, miss = 0, tbl = 0, img = 0, eq = 0, capHit = 0, capMiss = 0, headHit = 0, headMiss = 0, tocDrop = 0, noteBlocks = 0;
for (const f of SPINE) {
  const p = path.join(NEW, f);
  if (!fs.existsSync(p)) { out.push(`> ⚠ 规范源缺少 ${f}`); continue; }
  let blks = readBlocks(p);
  if (f === '00-part0.md') {
    const rows = [];
    const isFrag = b => isTable(b.text) && /^[|] (Cosmos|Cosmos-Framework|Cosmos3-|SDG-|Cosmos-HUE)/m.test(b.text);
    const kept = [];
    let insertAt = -1;
    blks.forEach((b, i) => {
      if (isFrag(b)) {
        if (insertAt < 0) insertAt = kept.length;
        const L = b.text.split('\n').filter(l => l.startsWith('|'));
        L.forEach((l, j) => { if (j === 1) return; const c = l.slice(1, -1).split('|').map(x => x.trim()); if (c.length >= 2 && c[0]) rows.push(c); });
        return;
      }
      kept.push(b);
    });
    if (rows.length && insertAt >= 0) {
      const tbl = ['| 分组 | 条目 | 地址 |', '|---|---|---|']
        .concat(rows.map(([n, u]) => `| ${GROUP(n)} | \`${n}\` | ${u} |`)).join('\n');
      kept.splice(insertAt, 0, { injected: true, line: 0, text: '> 标题页开源清单：PDF 中此块为内联 SVG 图形，解析只取到表体、分组标签随图形文字丢失；此处按条目名重建分组。\n\n' + tbl });
      resourceRows = rows.length;
    }
    blks = kept;
  }
  for (const b of blks) {
    const t = b.text;
    if (b.injected) { out.push(t); continue; }
    if (f === '00-part0.md' && /^\d+\.\s/.test(t)) { tocDrop++; continue; }
    if (f === '00-part0.md' && /^\*\*作者：\*\*/.test(t)) { out.push('**作者：** NVIDIA Cosmos Team（贡献者名单与致谢见附录 G）'); continue; }
    if (/^#{1,6}\s*Abstract$/.test(t.trim())) { out.push('## 摘要（Abstract）'); continue; }
    if (/^#{1,6}\s*Contents$/.test(t.trim()) || /^Contents$/.test(t.trim())) continue;
    if (isImg(t)) { img++; out.push(t); continue; }
    if (isTable(t)) { tbl++; out.push(zhHeaders(t)); continue; }
    if (/^(※|> ⚠|> （|图内文字)/.test(t)) { noteBlocks++; out.push(t); continue; }   // 提取器生成的还原说明（中文），不计入未译
    if (/^\$\$[\s\S]*\$\$$/.test(t.trim())) { eq++; out.push(t.trim()); continue; }
    const g = lookup(t);
    const withFn = s => { const fns = t.match(/〔脚注[^〕]*〕/g) || []; return (!fns.length || /〔脚注/.test(s)) ? s : s + ' ' + zhFootnotes(fns.join(' ')); };
    if (isCap(t)) { if (g) { capHit++; out.push(withFn(g)); } else { capMiss++; missList.push({ f, line: b.line, text: flatOf(t) }); out.push(t); } continue; }
    if (isHead(t)) { if (g) { headHit++; out.push(withFn(g)); } else { headMiss++; missList.push({ f, line: b.line, text: flatOf(t) }); out.push(t); } continue; }
    if (g) { hit++; out.push(withFn(g)); }
    else { miss++; missList.push({ f, line: b.line, text: flatOf(t) }); out.push(t + '\n\n<sub>〔未匹配到既有译文：保留英文，待补〕</sub>'); }
  }
}
// 渲染层归一：LaTeXML 项目符残留与重复编号（不改内容）
for (let i = 0; i < out.length; i++) out[i] = out[i].replace(/^- •[ \t]+/gm, '- ').replace(/^(\d+)\.\s+(\d+)\.\s+/m, '$2. ');

const heads = out.filter(l => /^#{1,3} /.test(l)).map(l => { const m = l.match(/^(#{1,3})\s+(.*)$/); return { lv: m[1].length, t: m[2] }; });
const toc = '### 目录\n\n' + heads.filter(h => h.lv <= 2).map(h => (h.lv === 1 ? '- **' : '  - ') + h.t + (h.lv === 1 ? '**' : '')).join('\n') + '\n\n---\n\n';

const header = `# Cosmos 3：面向物理 AI 的全模态世界模型 —— 中文全译（1:1 结构还原）

> **原文**：*Cosmos 3: Omnimodal World Models for Physical AI*，NVIDIA Cosmos Team，2026-06-22，arXiv **2606.02800v4**（139 页）
> **骨架**：arXiv HTML（LaTeXML）解析结果。章节层级、图、表、公式、脚注按原文顺序与原位保留；表格合并单元格由 colspan/span 解析器处理，非人工重建。
> **正文范围**：摘要 + §1–§8（附录 A–G 未译）。含图 ${img} 处、表 ${tbl} 块（Table 1–21；全文 33 张表，Table 22–33 属附录）、独立公式 ${eq} 条、脚注 1 条；73 个图源在 \`docs/figures/\`（含 SVG）。
> **散文**：逐段中文全译。配对采用"整段归一化为主键 + 前缀仅在唯一时兜底"，并做数字一致性自检；未能匹配的句子保留英文并显式标注。
> **不做**：不合并段落、不提炼要点、不改数字、不猜测缺失内容。
> 原文 PDF：\`docs/cosmos3-technical-report.pdf\`；英文图文版：\`docs/paper/Cosmos3-英文原文图文版.md\`。

---

`;

const notesSec = `\n\n---\n\n## 校注：最终源相对各章译者当时所用版本的差异\n\n译者是分章并行开工的，依据的是提取器早期版本；其后提取器修掉了六个吞内容/错对齐的缺陷，因此部分译注里"源文缺失"的抱怨在最终版中已不成立：\n\n1. **Table 4（机器人数据细分）表体已恢复**——它与 Figure 9 并排嵌在同一 flex 容器内，早期解析在外层 figure 处停了脚。现 9 行 × 5 列，AgiBot 338 / 239.4K / 4.37K 等与 PDF 独立核对一致。\n2. **Table 10（推理器基准总表）表体已恢复**——它是 span 版表格（LaTeXML 用 \`span.ltx_tr\` 而非 \`<tr>\`），早期整表丢弃。现 54 行 × 18 列。\n3. **Table 1 列对齐已修正**——早期吞掉 \`colspan\`，使 10 个列名相对数值整体左移一列。\n4. **脚注 1 已内联**——即"公开 PAIBench-G 图生视频榜单（Qwen3-VL-235B-A22B 判分）不可复现"；早期解析跳过脚注，所以 §6 译注称"干净源不存在此脚注"，那是解析问题而非原文没有。\n5. **Figure 13 无图片文件**：arXiv HTML 把它渲染成内联 TikZ（无 \`<img>\`），本译本以「⚠」标注并还原其内部结构表，原图见 PDF。\n6. **配对键冲突已修正**：源中有两段开头完全相同（"To evaluate Cosmos 3 under real-world scenarios…"，一段讲 T2I 榜、一段讲 I2V 榜），早期按前 70 字建键导致后者被前者覆盖；现改为整段键。此类前缀冲突现存 **${prefixCollisions.length}** 组，仅当唯一时才用作兜底。\n\n其余"源文自相矛盾"条目（Table 8 表题 GPU 数 2048/4096 与正文 1024/2048 不一致；Cosmos-HUE 图生视频正文 88.5 与表 14 的 88.6；DreamZero 正文 25.2% 与表 19 的 23.9；PAIBench-G 六域求和 1,033 与文中 1,044；AVQ 公式写作 AQ 而正文与表格用 PQ；§6.2.1 与 §6.2.2 各有一段以"To evaluate Cosmos 3 under real-world scenarios"开头但内容分指 T2I/I2V）**均为原文自身问题，本译本一律照录未改**。\n` +
  [...notesB.entries()].filter(([, arr]) => arr.length)
    .map(([f, arr]) => `\n\n---\n\n## 附：${f} 的译注与源文不一致清单\n\n` + arr.map(b => b.text.replace(/^#{1,6}[ \t]*/, '#### ')).join('\n\n')).join('');

const footer = `\n\n---\n\n## 合并校验\n\n- 散文：命中译文 **${hit}**，未命中 **${miss}**\n- 标题：命中 **${headHit}**，未命中 **${headMiss}**\n- 表题/图题：命中 **${capHit}**，未命中 **${capMiss}**\n- 表格块 **${tbl}**，图片行 **${img}**，独立公式 **${eq}** 条，提取器说明块 **${noteBlocks}** 条，丢弃 HTML 目录残渣 **${tocDrop}** 块\n- 主键条目 **${dict.size}**，前缀冲突组 **${prefixCollisions.length}**\n\n### 分章配对\n\n\`\`\`\n${pairReport.join('\n')}\n\`\`\`\n\n### 审计发现（自检失败与主键冲突）\n\n\`\`\`\n${audits.slice(0, 25).join('\n') || '（无）'}\n\`\`\`\n\n### 未命中清单\n\n${missList.slice(0, 40).map(x => `- ${x.f}:${x.line}  ${x.text}`).join('\n') || '（无）'}\n`;

fs.writeFileSync(OUT, header + toc + out.join('\n\n') + footer + notesSec, 'utf8');
fs.writeFileSync(path.join(DOC, 'paper/pair-audit.txt'), (audits.join('\n\n') || '（无异常）') + '\n\n前缀冲突组：\n' + prefixCollisions.map(([p, ks]) => p + ' → ' + ks.length + ' 条').join('\n'), 'utf8');
console.log(JSON.stringify({
  bytes: fs.statSync(OUT).size, dict: dict.size, prefixCollisions: prefixCollisions.length,
  prose: { hit, miss }, heads: { hit: headHit, miss: headMiss }, captions: { hit: capHit, miss: capMiss },
  tables: tbl, images: img, equations: eq, noteBlocks, tocDrop, audits: audits.length, pairReport,
}, null, 1));
