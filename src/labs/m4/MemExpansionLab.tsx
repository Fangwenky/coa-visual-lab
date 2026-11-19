import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

interface Preset {
  id: string;
  label: string;
  totalWordsK: number;
  totalBits: number;
  chipWordsK: number;
  chipBits: number;
  cpuAddrBits: number;
  decodeMode: 'full' | 'line' | 'partial';
}

const PRESETS: Preset[] = [
  { id: 'bit', label: '位扩展：64K×1 → 64K×8 (P29)', totalWordsK: 64, totalBits: 8, chipWordsK: 64, chipBits: 1, cpuAddrBits: 16, decodeMode: 'full' },
  { id: 'word', label: '字扩展：16K×8 → 64K×8 (P31)', totalWordsK: 64, totalBits: 8, chipWordsK: 16, chipBits: 8, cpuAddrBits: 16, decodeMode: 'full' },
  { id: 'both', label: '字位同时扩展：16K×4 → 64K×8 (P33)', totalWordsK: 64, totalBits: 8, chipWordsK: 16, chipBits: 4, cpuAddrBits: 16, decodeMode: 'full' },
  { id: 'line', label: '线选法：2K×8 → 8K×8 (15位地址, P36)', totalWordsK: 8, totalBits: 8, chipWordsK: 2, chipBits: 8, cpuAddrBits: 15, decodeMode: 'line' },
  { id: 'partial', label: '部分译码法：2K×8 → 8K×8 (20位地址, P38)', totalWordsK: 8, totalBits: 8, chipWordsK: 2, chipBits: 8, cpuAddrBits: 20, decodeMode: 'partial' },
];

export default function MemExpansionLab() {
  const [presetId, setPresetId] = useState('both');
  const [testAddrHex, setTestAddrHex] = useState('8A3F');

  const p = PRESETS.find((x) => x.id === presetId) || PRESETS[0];

  const wordGroups = p.totalWordsK / p.chipWordsK;
  const bitCols = p.totalBits / p.chipBits;
  const totalChips = wordGroups * bitCols;

  const chipAddrBits = Math.round(Math.log2(p.chipWordsK * 1024));
  const usedHighBits = Math.max(0, Math.round(Math.log2(wordGroups)));
  const addrVal = parseInt(testAddrHex || '0', 16) & ((1 << p.cpuAddrBits) - 1);
  const addrBin = addrVal.toString(2).padStart(p.cpuAddrBits, '0');

  // Determine which word group is selected
  let selectedGroup = -1;
  let selectionNote = '';
  if (p.decodeMode === 'full') {
    const highSlice = usedHighBits > 0 ? parseInt(addrBin.slice(0, usedHighBits), 2) : 0;
    selectedGroup = highSlice;
    selectionNote =
      usedHighBits === 0
        ? `仅位扩展：全部 ${totalChips} 片同时被选中，并行输出 ${p.totalBits} 位数据。`
        : `全译码：高位 ${addrBin.slice(0, usedHighBits)} 经 ${usedHighBits}:${wordGroups} 译码器唯一拉低 CS${selectedGroup}，选中第 ${selectedGroup} 组（共 ${bitCols} 片）。`;
  } else if (p.decodeMode === 'line') {
    // Slide P36: A14..A11 (4 bits), active low! Only ONE bit may be 0.
    const high4 = addrBin.slice(0, 4); // A14 A13 A12 A11
    const zeroIndices = [0, 1, 2, 3].filter((idx) => high4[idx] === '0');
    if (zeroIndices.length === 1) {
      selectedGroup = 3 - zeroIndices[0]; // A11=0 -> 0#, A12=0 -> 1#, A13=0 -> 2#, A14=0 -> 3#
      selectionNote = `线选法有效：A14~A11 = ${high4}，仅 A${11 + selectedGroup}=0，选中 ${selectedGroup}# 芯片！（地址不连续）`;
    } else if (zeroIndices.length === 0) {
      selectionNote = `线选法未选中任何芯片：A14~A11 = 1111（全为1，无有效片选）。试输入 7100H 或 3A00H！`;
    } else {
      selectionNote = `⚠ 线选法冲突：A14~A11 = ${high4} 有多位同时为 0，多片同时选中会产生总线冲突！合法地址仅允许一位为 0（如 7000H, 6800H, 5800H, 3800H）。`;
    }
  } else {
    // Partial decoding (Slide P38): A19..A13 ignored, A12 A11 select 0#..3#, A10..A0 in-chip
    const unused7 = addrBin.slice(0, 7);
    const dec2 = addrBin.slice(7, 9);
    selectedGroup = parseInt(dec2, 2);
    const isBase = unused7 === '0000000';
    selectionNote = `部分译码：仅用 A12A11=${dec2} 选中 ${selectedGroup}# 芯片，高位 A19~A13=${unused7} 未参与译码！${
      isBase ? '当前处于基本地址区。' : '★ 当前处于地址重叠镜像区（修改高 7 位依然访问同一物理单元！）'
    }`;
  }

  return (
    <LabFrame
      id="lab-4-3"
      code="LAB-4.3"
      title="主存字/位扩展芯片矩阵 & 三种片选译码测试台"
      desc="涵盖课件 P29–P39 全部经典主存设计案例：切换扩展与片选模式，输入任意 CPU 地址实时查看译码结果、芯片选中状态与地址重叠效应。"
    >
      <div className="lab-toolbar">
        {PRESETS.map((pr) => (
          <button
            key={pr.id}
            type="button"
            className={`lab-btn ${pr.id === presetId ? 'primary' : ''}`}
            style={{ fontSize: 12.5 }}
            onClick={() => {
              setPresetId(pr.id);
              if (pr.id === 'line') setTestAddrHex('7120');
              else if (pr.id === 'partial') setTestAddrHex('A0810');
              else setTestAddrHex('8A3F');
            }}
          >
            {pr.label}
          </button>
        ))}
      </div>

      <div className="lab-toolbar" style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13 }}>
          输入 CPU 地址（{p.cpuAddrBits}位 Hex）：0x
          <input
            type="text"
            maxLength={5}
            className="lab-input"
            style={{ width: 92, marginLeft: 4 }}
            value={testAddrHex}
            onChange={(e) => setTestAddrHex(e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase())}
          />
        </label>
        <div className="mono" style={{ fontSize: 12.5, color: '#e6eef7' }}>
          二进制拆分：
          {p.decodeMode === 'partial' && (
            <span style={{ color: '#ff6b6b', padding: '2px 5px', background: 'rgba(255,107,107,0.16)', borderRadius: 3, marginRight: 4 }}>
              未用高位 {addrBin.slice(0, 7)}
            </span>
          )}
          {p.decodeMode === 'partial' ? (
            <span style={{ color: '#ffb03b', padding: '2px 5px', background: 'rgba(255,176,59,0.2)', borderRadius: 3, marginRight: 4 }}>
              片选 {addrBin.slice(7, 9)}
            </span>
          ) : p.decodeMode === 'line' ? (
            <span style={{ color: '#ffb03b', padding: '2px 5px', background: 'rgba(255,176,59,0.2)', borderRadius: 3, marginRight: 4 }}>
              线选 {addrBin.slice(0, 4)}
            </span>
          ) : usedHighBits > 0 ? (
            <span style={{ color: '#ffb03b', padding: '2px 5px', background: 'rgba(255,176,59,0.2)', borderRadius: 3, marginRight: 4 }}>
              片选 {addrBin.slice(0, usedHighBits)}
            </span>
          ) : null}
          <span style={{ color: '#4ea1ff', padding: '2px 5px', background: 'rgba(78,161,255,0.2)', borderRadius: 3 }}>
            片内字选 A{chipAddrBits - 1}~A0: {addrBin.slice(addrBin.length - chipAddrBits)}
          </span>
        </div>
      </div>

      {/* Chip matrix */}
      <div className="lab-subpanel" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <span className="lab-label" style={{ margin: 0 }}>
            芯片阵列布局：{wordGroups} 组(字扩展) × {bitCols} 列(位扩展) = <strong style={{ color: '#38d9a9' }}>{totalChips} 片</strong>（每片 {p.chipWordsK}K×{p.chipBits}）
          </span>
          <span className="mono" style={{ fontSize: 12, color: '#8ea5be' }}>
            总容量 = {p.totalWordsK}K×{p.totalBits}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: wordGroups }, (_, g) => {
            const active = g === selectedGroup;
            const startAddr = g * p.chipWordsK * 1024;
            const endAddr = (g + 1) * p.chipWordsK * 1024 - 1;
            const lineRanges = ['7000~77FFH', '6800~6FFFH', '5800~5FFFH', '3800~3FFFH'];
            const rangeText =
              p.decodeMode === 'line'
                ? lineRanges[g]
                : `${startAddr.toString(16).toUpperCase().padStart(4, '0')}~${endAddr.toString(16).toUpperCase().padStart(4, '0')}H`;

            return (
              <div
                key={g}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 5,
                  background: active ? 'rgba(56, 217, 169, 0.14)' : '#0e1722',
                  border: `1px solid ${active ? '#38d9a9' : '#25384d'}`,
                }}
              >
                <div className="mono" style={{ width: 136, fontSize: 11.5, color: active ? '#38d9a9' : '#8ea5be', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700 }}>CS{g} {active ? '= 0 (选中)' : '= 1'}</div>
                  <div>{rangeText}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${bitCols}, minmax(0, 1fr))`, gap: 6, flex: 1 }}>
                  {Array.from({ length: bitCols }, (_, b) => {
                    const lowBit = (bitCols - 1 - b) * p.chipBits;
                    const highBit = lowBit + p.chipBits - 1;
                    return (
                      <div
                        key={b}
                        className="mono"
                        style={{
                          textAlign: 'center',
                          padding: '6px 4px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: active ? 'rgba(78, 161, 255, 0.22)' : '#14202e',
                          border: `1px solid ${active ? '#4ea1ff' : '#2a3f56'}`,
                          color: active ? '#ffffff' : '#7b92a8',
                        }}
                      >
                        <div>{p.chipWordsK}K×{p.chipBits}</div>
                        <div style={{ fontSize: 10, color: active ? '#38d9a9' : '#6c8198' }}>
                          {p.chipBits === 1 ? `D${highBit}` : `D${highBit}~D${lowBit}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lab-status-bar">{selectionNote}</div>
    </LabFrame>
  );
}
