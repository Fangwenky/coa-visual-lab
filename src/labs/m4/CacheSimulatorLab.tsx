import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { LabFrame } from '../../components/DocBlocks';

type MappingType = 'direct' | 'set2' | 'full';
type ReplaceAlgo = 'LRU' | 'FIFO';

interface CacheLine {
  valid: boolean;
  tag: number;
  blockNum: number;
  insertedAt: number;
  lastUsedAt: number;
}

interface AccessLog {
  step: number;
  blockNum: number;
  setIdx: number;
  tag: number;
  hit: boolean;
  evictedBlock: number | null;
  wayIdx: number;
}

const TOTAL_LINES = 4; // 4 Cache blocks, 16 Main Memory blocks (0..15)

function simulateCache(seq: number[], mapping: MappingType, algo: ReplaceAlgo) {
  const numSets = mapping === 'direct' ? 4 : mapping === 'set2' ? 2 : 1;
  const ways = TOTAL_LINES / numSets;

  const sets: CacheLine[][] = Array.from({ length: numSets }, () =>
    Array.from({ length: ways }, () => ({
      valid: false,
      tag: -1,
      blockNum: -1,
      insertedAt: -1,
      lastUsedAt: -1,
    }))
  );

  const logs: AccessLog[] = [];
  let hits = 0;

  seq.forEach((blk, step) => {
    const setIdx = blk % numSets;
    const tag = Math.floor(blk / numSets);
    const set = sets[setIdx];

    const hitWay = set.findIndex((line) => line.valid && line.tag === tag);
    if (hitWay !== -1) {
      hits++;
      set[hitWay].lastUsedAt = step;
      logs.push({ step: step + 1, blockNum: blk, setIdx, tag, hit: true, evictedBlock: null, wayIdx: hitWay });
    } else {
      let targetWay = set.findIndex((line) => !line.valid);
      let evictedBlock: number | null = null;
      if (targetWay === -1) {
        // Evict by LRU or FIFO
        targetWay = 0;
        for (let w = 1; w < ways; w++) {
          const curMetric = algo === 'LRU' ? set[w].lastUsedAt : set[w].insertedAt;
          const bestMetric = algo === 'LRU' ? set[targetWay].lastUsedAt : set[targetWay].insertedAt;
          if (curMetric < bestMetric) targetWay = w;
        }
        evictedBlock = set[targetWay].blockNum;
      }
      set[targetWay] = { valid: true, tag, blockNum: blk, insertedAt: step, lastUsedAt: step };
      logs.push({ step: step + 1, blockNum: blk, setIdx, tag, hit: false, evictedBlock, wayIdx: targetWay });
    }
  });

  return { sets, logs, hits, numSets, ways };
}

export default function CacheSimulatorLab() {
  const [mapping, setMapping] = useState<MappingType>('set2');
  const [algo, setAlgo] = useState<ReplaceAlgo>('LRU');
  const [seq, setSeq] = useState<number[]>([0, 4, 0, 4, 1, 5, 0, 4]);
  const [tCache, setTCache] = useState(50); // Slide P68: 50ns
  const [tMem, setTMem] = useState(250); // Slide P68: 250ns

  const { sets, logs, hits, numSets, ways } = simulateCache(seq, mapping, algo);
  const hitRate = seq.length > 0 ? hits / seq.length : 0;
  const lookThrough = tCache + (1 - hitRate) * tMem;
  const lookAside = hitRate * tCache + (1 - hitRate) * tMem;

  const appendBlock = (blk: number) => setSeq((prev) => [...prev, blk]);

  return (
    <LabFrame
      id="lab-4-4"
      code="LAB-4.4"
      title="Cache 三种地址映像、LRU/FIFO 替换 & 平均访问时间模拟器"
      desc="4 块 Cache 对应 16 块主存（0~15）：对比直接映像在 0,4,0,4 时的抖动冲突与组相联/全相联的化解效果，并实时计算贯通查找式 vs 旁路式平均访问时间。"
    >
      <div className="lab-toolbar">
        <div style={{ display: 'inline-flex', gap: 4 }}>
          {(
            [
              ['direct', '直接映像 (4组×1路)'],
              ['set2', '2路组相联 (2组×2路)'],
              ['full', '全相联 (1组×4路)'],
            ] as [MappingType, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" className={`lab-btn ${mapping === id ? 'primary' : ''}`} onClick={() => setMapping(id)}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'inline-flex', gap: 4 }}>
          {(['LRU', 'FIFO'] as ReplaceAlgo[]).map((a) => (
            <button key={a} type="button" className={`lab-btn ${algo === a ? 'active' : ''}`} onClick={() => setAlgo(a)}>
              {a} 替换
            </button>
          ))}
        </div>
        <button type="button" className="lab-btn" onClick={() => setSeq([0, 4, 0, 4, 0, 4])}>
          预设：抖动冲突(0,4交替)
        </button>
        <button type="button" className="lab-btn" onClick={() => setSeq([0, 1, 2, 0, 1, 3, 0, 4, 0, 1])}>
          预设：LRU vs FIFO 差异
        </button>
        <button type="button" className="lab-btn" onClick={() => setSeq([])}>
          <RotateCcw size={14} /> 清空序列
        </button>
      </div>

      {/* Clickable Main Memory Blocks */}
      <div className="lab-subpanel" style={{ marginBottom: 14 }}>
        <span className="lab-label">点击下方主存块号（0~15）追加一次 CPU 访存请求：</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 6 }}>
          {Array.from({ length: 16 }, (_, b) => (
            <button key={b} type="button" className="lab-btn" style={{ justifyContent: 'center', fontFamily: 'var(--font-mono)' }} onClick={() => appendBlock(b)}>
              块 {b} ({b.toString(2).padStart(4, '0')})
            </button>
          ))}
        </div>
        <div className="mono" style={{ marginTop: 10, fontSize: 12.5, color: '#8ea5be' }}>
          当前访问序列 ({seq.length}次)：
          {seq.length === 0 ? ' 空' : seq.map((b, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                margin: '2px 3px',
                padding: '1px 6px',
                borderRadius: 3,
                background: logs[i]?.hit ? 'rgba(56,217,169,0.22)' : 'rgba(255,107,107,0.22)',
                color: logs[i]?.hit ? '#38d9a9' : '#ff9999',
              }}
            >
              {b}({logs[i]?.hit ? '中' : '缺'})
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
        {/* Live Cache Table */}
        <div className="lab-subpanel">
          <span className="lab-label">当前 Cache 目录与数据块状态（{numSets} 组 × {ways} 路）</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sets.map((set, si) => (
              <div key={si} style={{ background: '#0e1722', border: '1px solid #25384d', borderRadius: 5, padding: '8px 10px' }}>
                <div className="mono" style={{ fontSize: 11.5, color: '#4ea1ff', marginBottom: 6 }}>
                  Set {si}（接收主存块号 mod {numSets} = {si}）
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ways}, minmax(0, 1fr))`, gap: 6 }}>
                  {set.map((line, wi) => (
                    <div
                      key={wi}
                      className="mono"
                      style={{
                        padding: '6px 8px',
                        borderRadius: 4,
                        fontSize: 11.5,
                        background: line.valid ? 'rgba(56, 217, 169, 0.14)' : '#14202e',
                        border: `1px solid ${line.valid ? '#38d9a9' : '#2a3f56'}`,
                      }}
                    >
                      <div style={{ color: '#8ea5be', fontSize: 10.5 }}>路 {wi}</div>
                      {line.valid ? (
                        <>
                          <div style={{ color: '#ffffff', fontWeight: 700 }}>主存块 {line.blockNum}</div>
                          <div style={{ color: '#ffb03b', fontSize: 10.5 }}>Tag={line.tag} · t用={line.lastUsedAt + 1}</div>
                        </>
                      ) : (
                        <div style={{ color: '#586d84' }}>空闲</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access trace & Timing */}
        <div className="lab-subpanel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="lab-label">命中率与平均访存时间联动（默认课件 P68 参数：50ns / 250ns）</span>
          <div style={{ display: 'flex', gap: 10, fontSize: 12.5 }}>
            <label>
              Cache周期(ns)
              <input type="number" className="lab-input" style={{ width: 68, marginLeft: 5 }} value={tCache} onChange={(e) => setTCache(Math.max(1, Number(e.target.value) || 1))} />
            </label>
            <label>
              主存周期(ns)
              <input type="number" className="lab-input" style={{ width: 68, marginLeft: 5 }} value={tMem} onChange={(e) => setTMem(Math.max(1, Number(e.target.value) || 1))} />
            </label>
          </div>
          <div className="lab-metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="lab-metric" style={{ background: '#0e1722' }}>
              <div className="lab-metric-k">命中率 H</div>
              <div className="lab-metric-v" style={{ color: '#38d9a9' }}>{(hitRate * 100).toFixed(1)}%</div>
            </div>
            <div className="lab-metric" style={{ background: '#0e1722' }}>
              <div className="lab-metric-k">贯通查找式</div>
              <div className="lab-metric-v" style={{ color: '#ffb03b', fontSize: 15 }}>{lookThrough.toFixed(1)} ns</div>
            </div>
            <div className="lab-metric" style={{ background: '#0e1722' }}>
              <div className="lab-metric-k">旁路式</div>
              <div className="lab-metric-v" style={{ color: '#4ea1ff', fontSize: 15 }}>{lookAside.toFixed(1)} ns</div>
            </div>
          </div>

          <div style={{ maxHeight: 165, overflowY: 'auto', fontSize: 12 }} className="mono">
            {logs.slice(-8).reverse().map((l) => (
              <div key={l.step} style={{ padding: '4px 0', borderBottom: '1px solid #1d2e41', color: l.hit ? '#38d9a9' : '#ff9999' }}>
                #{l.step} 访块{l.blockNum} → Set {l.setIdx}, Tag {l.tag} · {l.hit ? `命中(路${l.wayIdx})` : `未命中${l.evictedBlock !== null ? ` (替换块${l.evictedBlock})` : ' (装入空位)'}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lab-status-bar">
        对比提示：点击「预设：抖动冲突(0,4交替)」，直接映像下主存块 0 和块 4 同映射到 Set 0，命中率为 <strong>0%</strong>；切换为 <strong>2路组相联</strong> 后，Set 0 有两路槽位同时容纳块 0 与块 4，命中率立刻跃升至 <strong>66.7%</strong>！
      </div>
    </LabFrame>
  );
}
