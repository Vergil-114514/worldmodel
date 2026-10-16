// 合并器 v2：以修复后的新源（en4）为骨架
//   - 表格 / 图片行 / 公式 / 表题图题：一律取新源（结构由提取器保证）
//   - 散文（段落/小标题/列表项）：按内容匹配回填各章译文
//   - 未匹配到的散文：保留英文原句并标注（不猜测、不空着）
// 运行：node --input-type=module -e "import('file:///D:/科研/worldmodel/docs/paper/merge2.mjs').then(m=>m.build())"
import fs from 'node:fs';
import path from 'node:path';

const DOC = 'D:/科研/worldmodel/docs';
const OLD = path.join(DOC, 'paper/en');      // 译者实际依据的旧提取（用于内容对齐）
const NEW = path.join(DOC, 'paper/en4');     // 修复后的权威源（表格/图片/公式）
const ZH = path.join(DOC, 'paper/zh');
const OUT = path.join(DOC, 'Cosmos3-中文全译.md');

// 章 -> 译文文件；§6 按旧源行区间拆成上/下两部分
const MAP = [
  { file: '00-part0.md', zh: ['A-摘要-§1引言-§8结论.md'], upto: null },
  { file: '01-1-Introduction.md', zh: [], note: 'A 文件内含 §1' },
  { file: '02-2-Model-Architecture.md', zh: ['B-§2-模型架构.md'], upto: null },
  { file: '03-3-Data.md', zh: ['C-§3-数据.md'], upto: null },
  { file: '04-4-Training.md', zh: ['D-§4-训练.md'], upto: null },
  { file: '05-5-Infrastructure.md', zh: ['E-§5-基础设施.md'], upto: null },
  { file: '06-6-Results.md', zh: ['G-§6-结果-上.md'], upto: 236, zh2: ['H-§6-结果-下.md'] },
  { file: '07-7-Related-Work.md', zh: ['F-§7-相关工作.md'], upto: null },
];

const isTableBlock = b => b.split('\n').filter(Boolean).every(l => l.startsWith('|')) && b.split('\n').filter(l => l.startsWith('|')).length > 1;
const isImgBlock = b => /^!\[/.test(b);
const isCaption = b => /^>\s*(Table|Figure)\s/.test(b);
const norm = s => s.replace(/〔脚注[^〕]*〕/g, '').replace(/\*\*/g, '').replace(/[`$\\{}\[\]()#>·，。、]/g, '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80);

function readBlocks(p) {
  const raw = fs.readFileSync(p, 'utf8');
  const lines = raw.split('\n');
  const out = [];
  let cur = [], start = 1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === '') { if (cur.length) { out.push({ text: cur.join('\n'), line: start }); cur = []; } }
    else { if (!cur.length) start = i + 1; cur.push(l); }
  }
  if (cur.length) out.push({ text: cur.join('\n'), line: start });
  return out;
}

// 表头单元格词典
const HEAD = {
  'model': '模型', 'variant': '变体', 'type': '类型', 'mode': '模式', 'base': '基座',
  'benchmark': '基准', 'capability': '能力', 'reasoning': '推理', 'generation': '生成',
  'general': '通用', 'robotics': '机器人', 'driving': '驾驶', 'smart infra.': '智慧基建',
  'audio': '音频', 'resolution': '分辨率', 'frames': '帧数', 'fps': '帧率', 'dimensions': '尺寸',
  'tasks': '任务数', 'episodes': 'episode 数', 'hours': '小时数', 'data source': '数据来源',
  'embodiment': '本体形态', 'score': '分数', 'overall': '综合', 'metric': '指标', 'metrics': '指标',
  'setting': '设置', 'value': '取值', 'stage': '阶段', 'llm layers': 'LLM 层数', 'hidden dim': '隐维度',
  'attn heads': '注意力头', 'kv heads': 'KV 头', 'head dim': '头维度', 'ffn dim': 'FFN 维度',
  'checkpoint': '检查点', 'description': '说明', 'demonstrates': '展示能力', 'workflow': '工作流',
  'inputs': '输入', 'outputs': '输出', 'domain': '领域', 'quality': '质量', 'image-level metrics': '图像级指标',
  'open-sourced': '开源', 'closed-sourced': '闭源', 'ground truth': '真实视频', 'step': '步骤',
  'state': '状态', 'notes': '注', 'category': '类别', 'text2image': '文生图', 'text2video': '文生视频',
  'image2video': '图生视频', 'fd: robot': '前向动力学(机器人)', 'policy: robot': '策略(机器人)',
};
function zhHeaders(tbl) {
  return tbl.split('\n').map((l, i) => {
    if (i === 1 || !l.startsWith('|')) return l;
    return '|' + l.slice(1, -1).split('|').map(c => {
      const t = c.trim(), bare = t.replace(/\*\*/g, '').trim().toLowerCase();
      return ' ' + (HEAD[bare] ? t.replace(new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), HEAD[bare]) : t) + ' ';
    }).join('|') + '|';
  }).join('\n');
}

export function build() {
  const dict = new Map();      // norm(旧源散文) -> 中文
  const stats = {};
  for (const cfg of MAP) {
    const oldPath = path.join(OLD, cfg.file);
    if (!fs.existsSync(oldPath)) continue;
    const oldB = readBlocks(oldPath);
    for (const zf of cfg.zh.concat(cfg.note ? [] : [])) { }
    const zhFiles = cfg.zh.concat(cfg.upto ? [cfg.zh[0]] : []);
    for (const f of new Set(cfg.zh.concat(cfg.zh2 || []))) {
      const p = path.join(ZH, f);
      if (!fs.existsSync(p)) { stats[f] = '缺失'; continue; }
      let zhB = readBlocks(p);
      zhB = zhB.filter(b => !/^## 译校说明|^## 本章内部不一致|^## 译者补注|^#{1,3}\s*(译|本章内部)/.test(b.text));
      // 行区间切分（§6 上/下）
      if (cfg.upto && f === cfg.zh[0]) zhB = zhB.filter(b => b.line <= cfg.upto + 2);
      if (cfg.upto && f === cfg.zh2[0]) zhB = zhB.filter(b => b.line > cfg.upto);
      const srcB = cfg.upto
        ? oldB.filter(b => (f === cfg.zh[0] ? b.line <= cfg.upto : b.line > cfg.upto))
        : oldB;
      // 只在同为散文时配对；表格/图片/表题按原样计入但不建映射
      const srcProse = srcB.filter(b => !isTableBlock(b.text) && !isImgBlock(b.text));
      const zhProse = zhB.filter(b => !isTableBlock(b.text) && !isImgBlock(b.text) && b.line > 0);
      let paired = Math.min(srcProse.length, zhProse.length);
      for (let i = 0; i < paired; i++) {
        const k = norm(srcProse[i].text);
        if (k && !dict.has(k)) dict.set(k, zhProse[i].text);
      }
      stats[cfg.file + ' / ' + f] = `旧散文块 ${srcProse.length}，译块 ${zhProse.length}，配对 ${paired}`;
    }
  }

  // 以新源为骨架输出
  const out = [];
  let miss = 0, hit = 0, tbl = 0, img = 0;
  for (const cfg of MAP) {
    const newPath = path.join(NEW, cfg.file);
    if (!fs.existsSync(newPath)) { out.push(`> ⚠ 缺少新源文件 ${cfg.file}`); continue; }
    for (const b of readBlocks(newPath)) {
      const t = b.text;
      if (isImgBlock(t)) { img++; out.push(t); continue; }
      if (isTableBlock(t)) { tbl++; out.push(zhHeaders(t)); continue; }
      if (isCaption(t)) { const g = dict.get(norm(t)); out.push(g || t); if (g) hit++; else miss++; continue; }
      const g = dict.get(norm(t));
      if (g) { hit++; out.push(g); }
      else { miss++; out.push(t + '\n\n<!-- 未匹配到译文，保留英文原文 -->'); }
    }
  }

  const header = `# Cosmos 3：面向物理 AI 的全模态世界模型 —— 中文全译（1:1 结构还原）

> **原文**：Cosmos 3: Omnimodal World Models for Physical AI，NVIDIA Cosmos Team，2026-06-22，arXiv 2606.02800v4（139 页）
> **本译本的骨架**：arXiv HTML（LaTeXML）解析出的原文结构 —— 章节层级、图（73 个图源见 \`docs/figures/\`）、表（33 张，列对齐由 colspan/span 表格解析保证）、公式（原 LaTeX）、脚注均按原文顺序与位置保留；散文部分为逐段中文全译。
> **不做的事**：不合并段落、不提炼要点、不改数字、不猜测缺失内容；未能匹配到译文的句子保留英文原样并加注释。
> 原文 PDF：\`docs/cosmos3-technical-report.pdf\`；英文图文版：\`docs/paper/Cosmos3-英文原文图文版.md\`。

---

`;
  fs.writeFileSync(OUT, header + out.join('\n\n') + '\n', 'utf8');
  return { out: OUT, bytes: fs.statSync(OUT).size, tables: tbl, images: img, matched: hit, unmatched: miss, stats };
}

if (process.argv[1] && process.argv[1].endsWith('merge2.mjs')) console.log(JSON.stringify(build(), null, 2));
