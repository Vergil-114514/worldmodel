// 合并器 v3：以修复后的新源（en4）为骨架，散文按"标题分段 + 段内位置"配对回填译文
// 运行：node --input-type=module -e "import('file:///D:/科研/worldmodel/docs/paper/merge3.mjs').then(m=>console.log(JSON.stringify(m.build(),null,2)))"
import fs from 'node:fs';
import path from 'node:path';

const DOC = 'D:/科研/worldmodel/docs';
const OLD = path.join(DOC, 'paper/old-en-superseded');   // 译者实际依据的那版提取（仅用于散文对齐）
const NEW = path.join(DOC, 'paper/en');                  // 修复后的规范源：表格/图片/公式的唯一依据
const ZH = path.join(DOC, 'paper/zh');
const OUT = path.join(DOC, 'Cosmos3-中文全译.md');

// 每个译文文件 ↔ 它当初翻译的旧源文件（§6 按旧源行区间一分为二）
const PAIRS = [
  { zh: 'A-摘要-§1引言-§8结论.md', old: ['00-part0.md', '01-1-Introduction.md', '08-8-Conclusion.md'] },
  { zh: 'B-§2-模型架构.md', old: ['02-2-Model-Architecture.md'] },
  { zh: 'C-§3-数据.md', old: ['03-3-Data.md'] },
  { zh: 'D-§4-训练.md', old: ['04-4-Training.md'] },
  { zh: 'E-§5-基础设施.md', old: ['05-5-Infrastructure.md'] },
  { zh: 'G-§6-结果-上.md', old: ['06-6-Results.md'], lineRange: [1, 236] },
  { zh: 'H-§6-结果-下.md', old: ['06-6-Results.md'], lineRange: [237, 99999] },
  { zh: 'F-§7-相关工作.md', old: ['07-7-Related-Work.md'] },
];
const SPINE = ['00-part0.md', '01-1-Introduction.md', '02-2-Model-Architecture.md', '03-3-Data.md',
  '04-4-Training.md', '05-5-Infrastructure.md', '06-6-Results.md', '07-7-Related-Work.md', '08-8-Conclusion.md'];

const isTable = b => { const L = b.split('\n').filter(l => l.trim()); return L.length > 1 && L.every(l => l.startsWith('|')); };
const isImg = b => /^!\[/.test(b);
const isCap = b => /^>\s*(Table|Figure)\s/.test(b);
const isHead = b => /^#{1,6}\s/.test(b);
const stripNote = b => b.replace(/〔脚注[^〕]*〕/g, '').replace(/\s+/g, ' ');
const key = b => stripNote(b).replace(/\*\*/g, '').replace(/[`$\\{}[\]()#>]/g, '').replace(/[，。、．]/g, '').toLowerCase().slice(0, 70);

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

const dict = new Map();
const segReport = [];

for (const { zh, old, lineRange } of PAIRS) {
  const zp = path.join(ZH, zh);
  if (!fs.existsSync(zp)) { segReport.push(zh + ' 缺失'); continue; }
  // 旧源散文（按 lineRange 过滤）
  let oldB = [];
  for (const f of old) {
    const p = path.join(OLD, f); if (!fs.existsSync(p)) continue;
    oldB = oldB.concat(readBlocks(p).filter(b => !lineRange || (b.line >= lineRange[0] && b.line <= lineRange[1])));
  }
  const zhB = readBlocks(zp).filter(b => !/^#{1,6}\s*(译校说明|本章内部不一致|译者补注|译注)/.test(b.text))
    .filter(b => !/^※|^---$/.test(b.text.trim()));

  const segs = bs => { const o = [[]]; for (const b of bs) { if (isHead(b.text)) o.push([]); o[o.length - 1].push(b); } return o; };
  const os = segs(oldB), zs = segs(zhB);
  let paired = 0, skipped = 0;
  const n = Math.min(os.length, zs.length);
  for (let s = 0; s < n; s++) {
    const ob = os[s].filter(b => !isTable(b.text) && !isImg(b.text));
    const zb = zs[s].filter(b => !isTable(b.text) && !isImg(b.text));
    const m = Math.min(ob.length, zb.length);
    for (let i = 0; i < m; i++) { const k = key(ob[i].text); if (k && !dict.has(k)) { dict.set(k, zb[i].text); paired++; } else skipped++; }
    if (ob.length !== zb.length) skipped += Math.abs(ob.length - zb.length);
  }
  segReport.push(`${zh}: 段 ${os.length}/${zs.length} 配对 ${paired} 未配 ${skipped}`);
}

// 表头词典
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
  'text only': '纯文本', modality: '模态',
};
function zhHeaders(tbl) {
  return tbl.split('\n').map((l, i) => {
    if (i === 1 || !l.startsWith('|')) return l;
    return '|' + l.slice(1, -1).split('|').map(c => {
      const t = c.trim(); const bare = t.replace(/\*\*/g, '').trim().toLowerCase();
      if (!HEAD[bare]) return ' ' + t + ' ';
      return ' ' + t.replace(new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), HEAD[bare]) + ' ';
    }).join('|') + '|';
  }).join('\n');
}

export function build() {
  const out = [];
  const missList = [];
  let hit = 0, miss = 0, tbl = 0, img = 0, capHit = 0, capMiss = 0, droppedTOC = 0, noteOnly = 0;
  for (const f of SPINE) {
    const p = path.join(NEW, f);
    if (!fs.existsSync(p)) { out.push(`> ⚠ 缺新源文件 ${f}`); continue; }
    for (const b of readBlocks(p)) {
      let t = b.text;
      if (/^####\s*(Abstract|Contents)$/.test(t)) continue;                 // HTML 自动生成的结构标题
      if (/^Contents$/.test(t)) continue;
      if (/^1\.\s+1\s+Introduction/.test(t)) { droppedTOC++; continue; }     // HTML 目录残留（本译本另有中文目录）
      if (isImg(t)) { img++; out.push(t); continue; }
      if (isTable(t)) { tbl++; out.push(zhHeaders(t)); continue; }
      if (isCap(t)) { const g = dict.get(key(t)); if (g) { capHit++; out.push(g); } else { capMiss++; out.push(t); } continue; }
      const g = dict.get(key(t));
      if (g) { hit++; out.push(g); }
      else {
        // 新源独有的散文（旧提取缺失、Table 4 周边等）：留英文并显式标注
        miss++; missList.push({ f, line: b.line, text: t.slice(0, 110) });
        const zhGuess = dict.get(key(t.replace(/\[\d+\]/g, '')));
        out.push(zhGuess || t + '\n\n<sub>〔此段在旧提取中缺失，未匹配到既有译文；保留英文，待补译〕</sub>');
        if (zhGuess) noteOnly++;
      }
    }
  }
  const header = `# Cosmos 3：面向物理 AI 的全模态世界模型 —— 中文全译（1:1 结构还原）

> **原文**：*Cosmos 3: Omnimodal World Models for Physical AI*，NVIDIA Cosmos Team，2026-06-22，arXiv **2606.02800v4**（139 页）
> **骨架**：arXiv HTML（LaTeXML）解析出的原文结构。章节层级、图（73 个图源在 \`docs/figures/\`）、33 张表（colspan/span 表格已正确解析）、公式（原 LaTeX）、脚注均按原文顺序与原位保留。
> **散文**：逐段中文全译（八路分章翻译，按"标题分段 + 段内位置"回填）。合并统计见文末「合井校验」。
> **不做**：不合并段落、不提炼要点、不改数字、不猜测缺失内容；未能匹配译文的句子保留英文原文。
> 原文 PDF：\`docs/cosmos3-technical-report.pdf\`；英文图文对照版：\`docs/paper/Cosmos3-英文原文图文版.md\`。

---

`;
  const heads = out.filter(l => /^#{1,3} /.test(l)).map(l => { const mm = l.match(/^(#{1,3})\s+(.*)$/); return { lv: mm[1].length, t: mm[2] }; });
  const toc = '### 目录（按原文层级）\n\n' + heads.filter(h => h.lv <= 2).map(h => (h.lv === 1 ? '- **' : '  - ') + h.t + (h.lv === 1 ? '**' : '')).join('\n') + '\n\n---\n\n';

  const footer = `\n\n---\n\n## 合并校验\n\n- 散文块：命中译文 **${hit}**，未命中（保留英文） **${miss}**\n- 表题/图题：命中 **${capHit}**，未命中 **${capMiss}**\n- 表格块 **${tbl}**，图片行 **${img}**；丢弃 HTML 目录残留 **${droppedTOC}** 块\n- 分章配对报告：\n\n\`\`\`\n${segReport.join('\n')}\n\`\`\`\n\n- 未命中句清单（前 40 条）：\n\n${missList.slice(0, 40).map(m => `  · ${m.f}:${m.line}  ${m.text.replace(/\n/g, ' ')}`).join('\n')}\n`;
  fs.writeFileSync(OUT, header + toc + out.join('\n\n') + footer, 'utf8');
  return { out: OUT, bytes: fs.statSync(OUT).size, prose: { hit, miss }, captions: { hit: capHit, miss: capMiss }, tables: tbl, images: img, droppedTOC, dictSize: dict.size, segReport };
}
