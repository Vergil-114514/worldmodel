// 表格修复：用 colspan 修复后的干净源（en2）整表替换中文分片里的表格块
// 目的：表格的列对齐由提取器保证，不依赖译者手工重建；数字一律以源为准
// 运行：见文件末尾注释
import fs from 'node:fs';
import path from 'node:path';

const DOC = 'D:/科研/worldmodel/docs';
const SRC = path.join(DOC, 'paper/en2/ALL-english.md');   // 修复后的干净源
const ZHDIR = path.join(DOC, 'paper/zh');
const OUTDIR = path.join(DOC, 'paper/zh-fixed');

// 表头/单元格里可安全译出的通用英文词（模型名、基准名等一律不动）
const HEAD = {
  'Model': '模型', 'Variant': '变体', 'Base': '基座', 'Type': '类型', 'Mode': '模式',
  'Resolution': '分辨率', 'Frames': '帧数', 'Frame count': '帧数', 'FPS': '帧率',
  'Dimensions': '尺寸', 'Tasks': '任务数', 'Episodes': 'episode 数', 'Hours': '小时数',
  'Data source': '数据来源', 'Score': '分数', 'Overall': '综合', 'Metric': '指标', 'Metrics': '指标',
  'Setting': '设置', 'Value': '取值', 'Stage': '阶段', 'Layer': '层', 'Layers': '层数',
  'LLM Layers': 'LLM 层数', 'Hidden Dim': '隐维度', 'Attn Heads': '注意力头', 'KV Heads': 'KV 头',
  'Head Dim': '头维度', 'FFN Dim': 'FFN 维度', 'Capability': '能力', 'Reasoning': '推理',
  'Generation': '生成', 'General': '通用', 'Robotics': '机器人', 'Driving': '驾驶',
  'Smart infra.': '智慧基建', 'Audio': '音频', 'Image': '图像', 'Video': '视频',
  'Checkpoint': '检查点', 'Description': '说明', 'Demonstrates': '展示能力', 'Use it for': '用途',
  'Inputs': '输入', 'Outputs': '输出', 'Workflow': '工作流', 'Notes': '注', 'Category': '类别',
  'Domain': '领域', 'Prompt': '提示词', 'Seed': '随机种子', 'Steps': '步数', 'Guidance': '引导',
};

function blocks(txt) { return txt.split(/\n\n+/); }
function isTable(b) { const L = b.split('\n'); return L.length > 1 && L.every(l => l.startsWith('|')); }
function tableNum(b) { const n = b.match(/^>\s*Table\s+([0-9]+[a-z]?)\b/); return n ? n[1] : null; }

// 源表索引：caption(Table N) -> 紧随其后的表格块
const src = fs.readFileSync(SRC, 'utf8');
const sb = blocks(src);
const MAP = new Map();
for (let i = 0; i < sb.length; i++) {
  if (!sb[i].startsWith('> Table')) continue;
  const n = tableNum(sb[i]); if (!n) continue;
  for (let k = i + 1; k < Math.min(i + 4, sb.length); k++) { if (isTable(sb[k])) { if (!MAP.has(n)) MAP.set(n, sb[k]); break; } }
}

function translateHeaderCells(tbl) {
  const lines = tbl.split('\n');
  return lines.map((l, i) => {
    if (i === 1 || !l.startsWith('|')) return l;               // 分隔行不动
    const cells = l.slice(1, -1).split('|');
    const done = cells.map(c => {
      const t = c.trim();
      const bare = t.replace(/\*\*/g, '').trim();
      if (HEAD[bare]) return ' ' + t.replace(bare, HEAD[bare]) + ' ';
      return ' ' + t + ' ';
    });
    return '|' + done.join('|') + '|';
  }).join('\n');
}

fs.mkdirSync(OUTDIR, { recursive: true });
const report = [];
let replaced = 0, missed = [];
for (const f of fs.readdirSync(ZHDIR).filter(x => x.endsWith('.md'))) {
  const zh = fs.readFileSync(path.join(ZHDIR, f), 'utf8');
  const zb = blocks(zh);
  const out = zb.map((b, i) => {
    if (!isTable(b)) return b;
    let n = null;
    for (let k = i - 1; k >= Math.max(0, i - 3) && !n; k--) if (zb[k].startsWith('> Table')) n = tableNum(zb[k]);
    if (!n) return b;                                   // 无表题的表（如目录表）保留
    const srcT = MAP.get(n);
    if (!srcT) { missed.push(f + ' Table ' + n); return b; }
    const a = b.split('\n'), c = srcT.split('\n');
    const wid = s => (s[0].match(/\|/g) || []).length - 1;
    if (a.length === c.length && wid(a) === wid(c)) { replaced++; return b; }   // 结构相同：保留译者版（含中文表头）
    replaced++; return translateHeaderCells(srcT);                                // 结构不同：整表用源替换
  });
  fs.writeFileSync(path.join(OUTDIR, f), out.join('\n\n'), 'utf8');
  report.push(f + ' -> ' + path.join(OUTDIR, f).length + ' chars=' + fs.statSync(path.join(OUTDIR, f)).size);
}
console.log(JSON.stringify({ sourceTables: MAP.size, tableBlocksChecked: replaced, replacedFromSource: replaced, missed, report }, null, 2));
