import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

interface HuffNode {
  id: string;
  label: string;
  prob: number;
  left?: HuffNode;
  right?: HuffNode;
}

function buildHuffman(items: { name: string; prob: number }[]) {
  const total = items.reduce((s, it) => s + it.prob, 0) || 1;
  let nodes: HuffNode[] = items.map((it) => ({
    id: it.name,
    label: it.name,
    prob: it.prob / total,
  }));

  let mergeIdx = 0;
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.prob - b.prob || a.id.localeCompare(b.id));
    const a = nodes.shift()!;
    const b = nodes.shift()!;
    nodes.push({
      id: `M${mergeIdx++}`,
      label: `${(a.prob + b.prob).toFixed(2)}`,
      prob: a.prob + b.prob,
      left: b, // larger prob on '0' branch (matches Slide P24: I1=0)
      right: a,
    });
  }

  const codes: Record<string, string> = {};
  const walk = (node: HuffNode | undefined, prefix: string) => {
    if (!node) return;
    if (!node.left && !node.right) {
      codes[node.id] = prefix || '0';
      return;
    }
    walk(node.left, prefix + '0');
    walk(node.right, prefix + '1');
  };
  walk(nodes[0], '');
  return { root: nodes[0], codes, total };
}

export default function OpcodeHuffmanLab() {
  const [tab, setTab] = useState<'expand' | 'huffman'>('expand');

  // 4-4-4-4 Expanding opcode state (Slide P19-P20)
  const [n3, setN3] = useState(15); // 0..15 (leaving at least 1 window if we want 2-addr)
  const [n2, setN2] = useState(15);
  const [n1, setN1] = useState(15);

  const rem3 = 16 - n3; // windows for 2-addr
  const max2 = rem3 * 16;
  const clampedN2 = Math.min(n2, Math.max(0, max2 - (rem3 > 0 ? 1 : 0)));
  const rem2 = Math.max(0, max2 - clampedN2);
  const max1 = rem2 * 16;
  const clampedN1 = Math.min(n1, Math.max(0, max1 - (rem2 > 0 ? 1 : 0)));
  const rem1 = Math.max(0, max1 - clampedN1);
  const max0 = rem1 * 16;

  // Huffman state (Slide P22 default)
  const [probs, setProbs] = useState<number[]>([40, 30, 15, 5, 4, 3, 3]);
  const names = ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7'];
  const items = names.map((name, i) => ({ name, prob: probs[i] }));
  const { codes, total } = buildHuffman(items);

  const avgHuff = items.reduce((s, it) => s + (it.prob / total) * (codes[it.name]?.length || 0), 0);
  const ext24 = ['00', '01', '10', '1100', '1101', '1110', '1111'];
  const sortedForExt = [...items].sort((a, b) => b.prob - a.prob);
  const avgExt24 = sortedForExt.reduce((s, it, i) => s + (it.prob / total) * ext24[i].length, 0);
  const fixedLen = Math.ceil(Math.log2(items.length));

  return (
    <LabFrame
      id="lab-3-1"
      code="LAB-3.1"
      title="扩展操作码窗口分配器 & Huffman 优化编码构造器"
      desc="复现课件 P19–P27：亲手调节 16 位 4-4-4-4 扩展操作码各级窗口数量，并动态构造 7 条指令的 Huffman 码与 2-4 扩展码平均码长对比。"
    >
      <div className="lab-toolbar">
        <button type="button" className={`lab-btn ${tab === 'expand' ? 'primary' : ''}`} onClick={() => setTab('expand')}>
          16位 4-4-4-4 扩展操作码（P20）
        </button>
        <button type="button" className={`lab-btn ${tab === 'huffman' ? 'primary' : ''}`} onClick={() => setTab('huffman')}>
          Huffman 编码 & 2-4扩展编码（P22–P27）
        </button>
      </div>

      {tab === 'expand' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lab-subpanel">
            <span className="lab-label">指令格式（总长 16 位，每字段 4 位）：调节各级指令数量，观察扩展窗口如何逐级倍增</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <div className="mono" style={{ fontSize: 12.5, marginBottom: 6 }}>
                  三地址指令数：<strong style={{ color: '#4ea1ff' }}>{n3}</strong> / 15（留出 {rem3} 个扩展窗口）
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={n3}
                  onChange={(e) => setN3(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 12.5, marginBottom: 6 }}>
                  二地址指令数：<strong style={{ color: '#38d9a9' }}>{clampedN2}</strong> / {Math.max(0, max2 - 1)}（留出 {rem2} 窗口）
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.min(60, Math.max(0, max2 - 1))}
                  value={clampedN2}
                  onChange={(e) => setN2(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 12.5, marginBottom: 6 }}>
                  一地址指令数：<strong style={{ color: '#ffb03b' }}>{clampedN1}</strong> / {Math.max(0, max1 - 1)}（留出 {rem1} 窗口）
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.min(60, Math.max(0, max1 - 1))}
                  value={clampedN1}
                  onChange={(e) => setN1(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Visual 4-field layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="mono">
            {[
              { name: '三地址 (4位OP)', count: n3, opCols: 1, color: '#4ea1ff', range: n3 > 0 ? `0000 ~ ${(n3 - 1).toString(2).padStart(4, '0')} | A1 | A2 | A3` : '未分配' },
              { name: '二地址 (8位OP)', count: clampedN2, opCols: 2, color: '#38d9a9', range: `${rem3}个窗口×16 = ${max2}空间 → 已用 ${clampedN2} 条，余 ${rem2} 窗口` },
              { name: '一地址 (12位OP)', count: clampedN1, opCols: 3, color: '#ffb03b', range: `${rem2}个窗口×16 = ${max1}空间 → 已用 ${clampedN1} 条，余 ${rem1} 窗口` },
              { name: '零地址 (16位OP)', count: max0, opCols: 4, color: '#b197fc', range: `${rem1}个窗口×16 = 最多容纳 ${max0} 条零地址指令` },
            ].map((row) => (
              <div
                key={row.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 260px 1fr',
                  gap: 10,
                  alignItems: 'center',
                  background: '#14202e',
                  border: '1px solid #2a3f56',
                  borderRadius: 5,
                  padding: '8px 12px',
                  fontSize: 12.5,
                }}
              >
                <strong style={{ color: row.color }}>{row.name}</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      style={{
                        textAlign: 'center',
                        padding: '3px 0',
                        borderRadius: 3,
                        fontSize: 11,
                        background: idx < row.opCols ? 'rgba(78,161,255,0.22)' : '#0d1620',
                        border: `1px solid ${idx < row.opCols ? row.color : '#2a3f56'}`,
                        color: idx < row.opCols ? '#ffffff' : '#8ea5be',
                      }}
                    >
                      {idx < row.opCols ? 'OP' : `A${idx - row.opCols + 1}`}
                    </div>
                  ))}
                </div>
                <span style={{ color: '#c8d6e5', fontSize: 12 }}>{row.range}</span>
              </div>
            ))}
          </div>

          <div className="lab-status-bar">
            核心要点：① 短码不能是长码的前缀（例：三地址用 <code>0000~1110</code>，把 <code>1111</code> 留作扩展窗口进入二地址）；② 当前配置共可容纳{' '}
            <strong style={{ color: '#38d9a9' }}>{n3 + clampedN2 + clampedN1 + max0}</strong> 条唯一指令（课件标准 15/15/15/16 共 61 条）。
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lab-subpanel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="lab-label" style={{ margin: 0 }}>调整 7 条指令的使用频度权重（自动归一化），实时重算 Huffman 编码：</span>
              <button type="button" className="lab-btn" onClick={() => setProbs([40, 30, 15, 5, 4, 3, 3])}>
                恢复课件 P22 原题频度
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 8 }}>
              {names.map((name, i) => (
                <label key={name} className="mono" style={{ fontSize: 12, color: '#8ea5be' }}>
                  {name} ({((probs[i] / total) * 100).toFixed(1)}%)
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="lab-input"
                    style={{ width: '100%', marginTop: 4 }}
                    value={probs[i]}
                    onChange={(e) => {
                      const next = [...probs];
                      next[i] = Math.max(1, Number(e.target.value) || 1);
                      setProbs(next);
                    }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="mono" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a3f56', color: '#8ea5be', textAlign: 'left' }}>
                  <th style={{ padding: '7px 8px' }}>指令</th>
                  <th style={{ padding: '7px 8px' }}>使用概率 pᵢ</th>
                  <th style={{ padding: '7px 8px' }}>定长编码 (3位)</th>
                  <th style={{ padding: '7px 8px' }}>Huffman 编码</th>
                  <th style={{ padding: '7px 8px' }}>码长 lᵢ</th>
                  <th style={{ padding: '7px 8px' }}>2-4 扩展编码（按频度降序）</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const rank = sortedForExt.findIndex((s) => s.name === it.name);
                  const hCode = codes[it.name] || '';
                  return (
                    <tr key={it.name} style={{ borderBottom: '1px solid #1d2e41' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 700, color: '#4ea1ff' }}>{it.name}</td>
                      <td style={{ padding: '6px 8px' }}>{(it.prob / total).toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', color: '#8ea5be' }}>{idx.toString(2).padStart(3, '0')}</td>
                      <td style={{ padding: '6px 8px', color: '#38d9a9', fontWeight: 700 }}>{hCode}</td>
                      <td style={{ padding: '6px 8px' }}>{hCode.length} 位</td>
                      <td style={{ padding: '6px 8px', color: '#ffb03b' }}>{ext24[rank]} ({ext24[rank].length}位)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="lab-metric-grid">
            <div className="lab-metric">
              <div className="lab-metric-k">定长编码平均码长</div>
              <div className="lab-metric-v">{fixedLen.toFixed(2)} 位</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">2-4 扩展编码平均码长</div>
              <div className="lab-metric-v" style={{ color: '#ffb03b' }}>{avgExt24.toFixed(2)} 位</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">Huffman 最优平均码长</div>
              <div className="lab-metric-v" style={{ color: '#38d9a9' }}>{avgHuff.toFixed(2)} 位</div>
            </div>
          </div>

          <div className="lab-status-bar">
            工程权衡：Huffman 码平均长度最短（{avgHuff.toFixed(2)} 位），但码长极不规整、译码硬件复杂；<strong>2-4 扩展编码</strong>只用 2 位和 4 位两种规整码长，平均码长仅 {avgExt24.toFixed(2)} 位，兼顾压缩率与译码简易度！
          </div>
        </div>
      )}
    </LabFrame>
  );
}
