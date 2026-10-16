// arXiv HTML (LaTeXML) -> 结构化 Markdown 提取器
// 用途：为《Cosmos 3》中文全译提供 1:1 干净源：章节层级、图片原位、真实 LaTeX 公式、colspan/rowspan 正确的表格、脚注内联
// 运行（ESM）：node --input-type=module -e "import('file:///D:/科研/worldmodel/docs/paper/extract.mjs').then(m=>console.log(JSON.stringify(m.runTo('en2'))))"
import fs from 'node:fs';
import path from 'node:path';

const DOC = 'D:/科研/worldmodel/docs';
const HTML = path.join(DOC, 'arxiv-2606.02800v4.html');
const OUT_TXT = path.join(DOC, 'paper/assets.txt');

const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);
const OPAQUE = new Set(['svg', 'script', 'style']);

function decode(t) {
  return t.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

export function buildDom(src) {
  const root = { name: 'root', attrs: {}, children: [], parent: null };
  let cur = root;
  const tok = /<\/([a-zA-Z0-9]+)\s*>|<([a-zA-Z0-9]+)((?:[^>"]|"[^"]*")*?)(\/?)>|([^<]+)/g;
  let m, guard = 0;
  while ((m = tok.exec(src)) && guard++ < 8000000) {
    if (m[5] !== undefined && m[5] !== '') { cur.children.push({ text: m[5] }); continue; }
    if (m[1]) {
      const name = m[1].toLowerCase();
      let n = cur;
      while (n && n.name !== name && n !== root) n = n.parent;
      if (n && n !== root) cur = n.parent || root;
      continue;
    }
    const name = m[2].toLowerCase(), as = m[3] || '', selfClose = m[4] === '/';
    const node = { name, attrs: {}, children: [], parent: cur };
    const ar = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*"([^"]*)"/g; let a;
    while ((a = ar.exec(as))) node.attrs[a[1]] = a[2];
    cur.children.push(node);
    if (!VOID.has(name) && !selfClose) cur = node;
  }
  return root;
}

/* ---------- 内联渲染 ---------- */
function zin(n, out) {
  if (n.text !== undefined) { out.push(n.text); return; }
  const cls = n.attrs.class || '';
  if (n.name === 'math') { out.push('$' + (n.attrs.alttext || '') + '$'); return; }
  if (OPAQUE.has(n.name)) return;
  if (n.name === 'span' && /ltx_role_footnote|ltx_note_footnote/.test(cls)) {   // 只认顶层脚注，避免嵌套重复包裹
    const kids = n.children || [];
    const mark = kids.find(c => c.name === 'sup' && /ltx_note_mark/.test(c.attrs.class || ''))
      || kids.find(c => c.name === 'span' && /ltx_tag/.test(c.attrs.class || ''));
    const num = mark ? stripTags(mark).trim() : '';
    const content = kids.find(c => /ltx_note_content/.test(c.attrs.class || '')) || kids.find(c => c !== mark);
    const tmp = [];
    if (content && content !== n) { for (const c of content.children || []) zin(c, tmp); }
    const t = decode(tmp.join('')).replace(/\s+/g, ' ').replace(/^【脚注\s*\d*[：:]\s*/, '').trim();
    if (t) out.push(`〔脚注${num}：${t}〕 `);
    return;
  }
  let inner = [];
  for (const c of n.children || []) zin(c, inner);
  let s = inner.join('');
  if (/ltx_font_bold/.test(cls)) s = '**' + s.trim() + '** ';
  else if (/ltx_font_italic/.test(cls)) s = '*' + s.trim() + '* ';
  out.push(s);
}
function stripTags(n) { const o = []; (function w(x) { if (x.text !== undefined) { o.push(x.text); return; } if (x.name === 'math' && x.attrs.alttext) { o.push(x.attrs.alttext); return; } for (const c of x.children || []) w(c); })(n); return decode(o.join('')); }
function text(n) { const o = []; zin(n, o); return decode(o.join('')).replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, ' ').replace(/\u00a0/g, ' ').trim(); }

/* ---------- 表格：colspan/rowspan 感知，且支持 LaTeXML 的 span 版表格 ---------- */
// 注意：LaTeXML 有两种表格写法：<table><tr><td> 与 <span class="ltx_tabular"><span class="ltx_tr"><span class="ltx_td">
// 只处理前一种会整表丢内容（论文里 Table 10 等 100+ 行是 span 版）
const isRow = n => !!n && !!n.attrs && (n.name === 'tr' || /(^|\s)ltx_tr(\s|$)/.test(n.attrs.class || ''));
const isCell = n => !!n && !!n.attrs && (n.name === 'td' || n.name === 'th' || /ltx_t[dh](\s|$)/.test((n.attrs.class || '') + ' '));
const isTabular = n => n && (n.name === 'table' ? /ltx_tabular/.test(n.attrs.class || '') : /ltx_tabular/.test(n.attrs.class || ''));

export function tableToMd(tbl) {
  const rows = [];
  (function walkRows(n, depth) {
    if (isRow(n)) {
      const cells = [];
      const collect = (c) => {
        if (isCell(c)) {
          // 真 <td> 才有 colspan/rowspan；span 版表格没有这些属性，取默认 1（不臆测列宽）
          const col = parseInt(c.attrs.colspan || '1', 10) || 1;
          const span = parseInt(c.attrs.rowspan || '1', 10) || 1;
          cells.push({ txt: text(c).replace(/\|/g, '\\|'), col, span });
          return;
        }
        for (const ch of c.children || []) if (ch.name) collect(ch);
      };
      for (const ch of n.children || []) collect(ch);
      if (cells.length) rows.push(cells);
      return;                                       // 不再深入（避免嵌套表串行）
    }
    for (const c of n.children || []) if (c.name) walkRows(c, depth + 1);
  })(tbl, 0);
  if (!rows.length) return { md: '', padded: 0 };

  // 展开 colspan / rowspan 占位
  const pending = {};
  const grid = [];
  for (const cells of rows) {
    const row = [];
    let ci = 0, k = 0;
    let guard = 0;
    while ((k < cells.length || pending[ci] !== undefined) && guard++ < 200) {
      if (pending[ci] !== undefined) {
        const p = pending[ci];
        row[ci] = p.txt;
        p.remaining--; if (p.remaining <= 0) delete pending[ci]; else pending[ci] = p;
        ci++; continue;
      }
      const c = cells[k++]; if (!c) continue;
      for (let j = 0; j < c.col; j++) row[ci + j] = j === 0 ? c.txt : '';
      if (c.span > 1) for (let j = 0; j < c.col; j++) pending[ci + j] = { txt: '', remaining: c.span - 1 };
      ci += c.col;
    }
    grid.push(row);
  }
  const W = Math.max(...grid.map(r => r.length));
  // span 版表格里被 rowspan 合并掉的单元格会整格消失，导致后续行左移一列。
  // 处理：短行按"首列被合并"在前补空；并记一条说明，绝不静默改数据。
  let padded = 0;
  for (const r of grid) {
    if (r.length < W) { const need = W - r.length; r.unshift(...Array(need).fill('')); padded += need; }
  }
  const esc = s => (s || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
  const lines = [];
  lines.push('| ' + grid[0].map(x => esc(x) || ' ').join(' | ') + ' |');
  lines.push('|' + Array(W).fill('---').join('|') + '|');
  for (const r of grid.slice(1)) lines.push('| ' + r.map(x => esc(x) || ' ').join(' | ') + ' |');
  return { md: lines.join('\n'), padded };
}

/* ---------- 块级遍历 ---------- */
const ASSETS = new Set();
const LINES = [];
function base(s) { return s.split('/').pop(); }
function graphics(f) {   // 全部后代图片（用于判断"这图有没有图"）
  const list = [];
  (function w(n) {
    if (n.name === 'img' && n.attrs.src) list.push(n.attrs.src);
    if (n.name === 'object' && n.attrs.data) list.push(n.attrs.data);
    for (const c of n.children || []) if (c.name) w(c);
  })(f);
  return list;
}
function directGraphics(f) {  // 直属图片：遇到嵌套 figure 就停，避免把子面板的图算到父容器头上
  const list = [];
  (function w(n) {
    for (const c of n.children || []) {
      if (!c.name) continue;
      if (c.name === 'figure') continue;
      if (c.name === 'img' && c.attrs.src) list.push(c.attrs.src);
      else if (c.name === 'object' && c.attrs.data) list.push(c.attrs.data);
      else w(c);
    }
  })(f);
  return list;
}
function captionOf(f) { for (const c of f.children || []) if (c.name === 'figcaption') return text(c); return ''; }
function firstTable(n) {   // 同时兼容 <table class="ltx_tabular"> 与 <span class="ltx_tabular">
  let tb = null;
  (function w(x) {
    if (tb) return;
    if (x.attrs && /ltx_tabular/.test(x.attrs.class || '') && !/ltx_equation/.test(x.attrs.class || '')) { tb = x; return; }
    for (const c of x.children || []) if (c.name) w(c);
  })(n);
  return tb;
}
function eqnFrom(t) { let latex = '', tag = ''; (function w(n) { if (n.name === 'math' && n.attrs.alttext && !latex) latex = n.attrs.alttext; if (n.name === 'td' && /ltx_tag_equation/.test(n.attrs.class || '')) tag = text(n); for (const c of n.children || []) if (c.name) w(c); })(t); return { latex, tag }; }
function emit(s) { LINES.push(s); }

let CURFIG = '';
function walkFloats(node, inherited) {
  const prev = CURFIG; if (inherited) CURFIG = inherited;
  for (const c of node.children || []) {
    if (!c.name) continue;
    const cls = c.attrs.class || '';
    if (c.name === 'figure' || /ltx_tabular/.test(cls)) { walkNode(c); continue; }   // 嵌套的图/表面板：交给主逻辑
    if (c.name === 'p' || c.name === 'math' || c.name === 'figcaption') continue;  // 图内标注不重复输出
    walkFloats(c, CURFIG);
  }
  CURFIG = prev;
}

export function walkNode(c) {
  {
    if (!c || !c.name) return;
    const cls = c.attrs.class || '';
    const hm = c.name.match(/^h([2-6])$/);
    if (hm) { const lv = Math.min(+hm[1] - 1, 4); emit('#'.repeat(lv) + ' ' + text(c)); return; }
    if (c.name === 'figure' && /ltx_figure/.test(cls) && !/ltx_table/.test(cls)) {
      const dg = directGraphics(c), all = graphics(c), cap = captionOf(c);
      const no = (cap.match(/^(Figure\s+[0-9]+[a-z]?)/i) || [])[1] || (CURFIG || 'Figure');
      if (dg.length) {
        dg.forEach((src, i) => { ASSETS.add(src); emit(`![${no}${dg.length > 1 ? ' 第' + (i + 1) + '张' : ''}](figures/${base(src)})`); });
        if (cap) emit('> ' + cap);
      } else if (!all.length) {
        // 无图片文件：可能是并排的表格面板（如 Table 4），也可能是内联 TikZ 的图（如 Figure 13）
        const isTablePanel = /^\s*Table\s*[0-9]/.test(cap);
        if (cap) emit('> ' + cap);
        const tb = firstTable(c);
        const { md, padded } = tb ? tableToMd(tb) : { md: '', padded: 0 };
        const hasRows = md && md.split('\n').filter(l => l.startsWith('|')).length > 2;
        if (!isTablePanel && !hasRows) emit(`> ⚠ ${no}：在 arXiv HTML 中为内联 TikZ 排版，无独立图片文件（原图见 PDF）`);
        else if (!isTablePanel) emit(`> （${no} 在 HTML 中为内联 TikZ，无图片文件；下表为其内容还原，原图见 PDF）`);
        if (hasRows) { emit(md); if (padded) emit('※ 本表含跨行合并单元格，短行已按「首列被合并」在前补空。'); }
        else if (!isTablePanel) {
          const inner = []; for (const ch of c.children || []) if (ch.name && ch.name !== 'figcaption') zin(ch, inner);
          const t2 = decode(inner.join('')).replace(/\s+/g, ' ').trim(); if (t2) emit('图内文字：' + t2);
        }
      } else if (cap) emit('> ' + cap);
      if (all.length) walkFloats(c, no);   // 有图时下钻找并排嵌套面板，并把图号传给无题面板
      return;
    }
    if (c.name === 'figure' && /ltx_table/.test(cls)) {
      const cap = captionOf(c); if (cap) emit('> ' + cap);
      const panels = (c.children || []).filter(x => x.name === 'figure');
      if (panels.length) { walkFloats(c); return; }          // 多联表：逐面板输出，保留各自小标题
      const tb = firstTable(c); if (tb) { const { md, padded } = tableToMd(tb); if (md) { emit(md); if (padded) emit('※ 本表含跨行合并单元格，短行已按「首列被合并」在前补空。'); } }
      return;
    }
    if (c.name === 'table' && /ltx_equation/.test(cls)) { const { latex, tag } = eqnFrom(c); emit('$$' + latex + '$$' + (tag ? '   [' + tag + ']' : '')); return; }
    if (/ltx_tabular/.test(cls) && (c.name === 'table' || c.name === 'span')) { const { md, padded } = tableToMd(c); if (md) { emit(md); if (padded) emit('※ 本表含跨行合并单元格，短行已按「首列被合并」在前补空。'); } return; }
    if (c.name === 'math') { emit('$$' + (c.attrs.alttext || '') + '$$'); return; }
    if (c.name === 'ul' || c.name === 'ol') {
      const items = (c.children || []).filter(x => x.name === 'li');
      items.forEach((li, i) => {
        const tx = text(li).replace(/^[•·◦]\s*/, '');        // 去掉 LaTeXML 写在 li 文本里的项目符
        const pre = (c.name === 'ol') ? (i + 1) + '. ' : '- ';
        emit(/^\d+\./.test(tx) ? tx : pre + tx);
        walkFloats(li);   // 列表项里可能嵌着浮动体（§3.2.3 的 Table 4/Figure 9 就在 li 内）
      });
      return;
    }
    if (c.name === 'div' && /ltx_authors/.test(cls)) { emit('**作者：** ' + text(c)); return; }
    if (c.name === 'p' && /ltx_p/.test(cls)) { emit(text(c)); return; }
    walk(c);
  }
}

export function walk(node) {
  for (const c of node.children || []) if (c.name) walkNode(c);
}

export function runTo(dir = 'en') {
  const OUT_EN = path.join(DOC, 'paper', dir);
  const raw = fs.readFileSync(HTML, 'utf8');
  const s0 = raw.indexOf('<article'), s1 = raw.lastIndexOf('</article>');
  const body = raw.slice(s0 > 0 ? s0 + 8 : 0, s1 > s0 ? s1 : raw.length);
  const dom = buildDom(body);
  LINES.length = 0; ASSETS.clear();
  walk(dom);
  const flat = LINES.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  fs.mkdirSync(OUT_EN, { recursive: true });
  fs.writeFileSync(path.join(OUT_EN, 'ALL-english.md'), flat + '\n', 'utf8');
  if (dir === 'en') fs.writeFileSync(OUT_TXT, [...ASSETS].join('\n') + '\n');
  if (dir === 'en') fs.writeFileSync(path.join(DOC, 'paper', 'Cosmos3-英文原文图文版.md'), flat.replace(/\(figures\//g, '(../figures/') + '\n', 'utf8');
  const parts = flat.split(/(?=^# )/m);
  parts.forEach((p, i) => {
    const t = (p.match(/^#\s*(.+)/) || [])[1] || ('part' + i);
    const nm = String(i).padStart(2, '0') + '-' + t.replace(/[^0-9A-Za-z]+/g, '-').slice(0, 42);
    fs.writeFileSync(path.join(OUT_EN, nm + '.md'), p.trim() + '\n', 'utf8');
  });
  const tables = [...flat.matchAll(/^\|[^\n]*\|[^\n]*$/gm)];
  return { outDir: OUT_EN, chars: flat.length, figures: (flat.match(/^!\[/gm) || []).length, tableRows: tables.length, assets: ASSETS.size, parts: parts.length, footnotes: (flat.match(/〔脚注/g) || []).length };
}

export const run = () => runTo('en');
