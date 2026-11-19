import React, { useState } from 'react';
import { LabFrame } from '../../components/DocBlocks';

type ArbMode = 'daisy' | 'counter' | 'independent';
type HandshakeMode = 'none' | 'half' | 'full';

export default function BusArbitrationLab() {
  const [tab, setTab] = useState<'arb' | 'handshake'>('arb');
  const [arbMode, setArbMode] = useState<ArbMode>('daisy');
  const [reqs, setReqs] = useState<boolean[]>([false, true, false, true]); // Dev 1..4
  const [brokenDev, setBrokenDev] = useState<number | null>(null); // 0..3 for daisy fault
  const [counterStart, setCounterStart] = useState(2); // 1..4 for polling counter
  const [handshake, setHandshake] = useState<HandshakeMode>('full');

  const toggleReq = (idx: number) => setReqs((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  // Determine winner
  let winner = -1;
  let pathText = '';
  if (arbMode === 'daisy') {
    const visited: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (brokenDev === i) {
        pathText = `⚠ 设备 ${i + 1} 查询链电路故障，BG 信号在此中断，其后的设备全部无法获得授权！`;
        break;
      }
      visited.push(i + 1);
      if (reqs[i]) {
        winner = i;
        pathText = `BG 依次经过设备 ${visited.join(' → ')}；设备 ${i + 1} 截获 BG 并拉高 BS(总线忙)，获得总线控制权！`;
        break;
      }
    }
    if (winner === -1 && !pathText) pathText = '当前无设备发起总线请求（BR=0）。';
  } else if (arbMode === 'counter') {
    const order = [0, 1, 2, 3].map((k) => (counterStart - 1 + k) % 4);
    const seq: number[] = [];
    for (const idx of order) {
      seq.push(idx + 1);
      if (reqs[idx]) {
        winner = idx;
        break;
      }
    }
    pathText =
      winner !== -1
        ? `计数器从初值 ${counterStart} 开始依次输出设备号：${seq.join(' → ')}，匹配到请求设备 ${winner + 1}，中止计数并授予总线！`
        : '当前无设备发起总线请求。';
  } else {
    winner = reqs.findIndex(Boolean);
    pathText =
      winner !== -1
        ? `所有设备经独立请求线 BRi 并行上报，仲裁器排队电路瞬间选出最高优先级设备 ${winner + 1}，经专用授权线 BG${winner + 1} 响应！`
        : '当前无设备发起总线请求。';
  }

  const lineCount = arbMode === 'daisy' ? '3 根 (BR, BG, BS)' : arbMode === 'counter' ? '2 + ⌈log₂n⌉ = 4 根' : '2n + 1 = 9 根';

  return (
    <LabFrame
      id="lab-6-1"
      code="LAB-6.1"
      title="集中式总线仲裁仿真器 & 异步定时三种互锁握手波形"
      desc="复现课件 P13–P20：勾选并发请求设备，对比链式查询（含断链故障）、计数器定时查询（可调初值）与独立请求的控制线数量及响应机制。"
    >
      <div className="lab-toolbar">
        <button type="button" className={`lab-btn ${tab === 'arb' ? 'primary' : ''}`} onClick={() => setTab('arb')}>
          三种集中式总线仲裁（P15–P20）
        </button>
        <button type="button" className={`lab-btn ${tab === 'handshake' ? 'primary' : ''}`} onClick={() => setTab('handshake')}>
          异步定时：不互锁 / 半互锁 / 全互锁（P13）
        </button>
      </div>

      {tab === 'arb' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lab-toolbar" style={{ marginBottom: 0 }}>
            <button type="button" className={`lab-btn ${arbMode === 'daisy' ? 'active' : ''}`} onClick={() => setArbMode('daisy')}>
              ① 链式查询
            </button>
            <button type="button" className={`lab-btn ${arbMode === 'counter' ? 'active' : ''}`} onClick={() => setArbMode('counter')}>
              ② 计数器定时查询
            </button>
            <button type="button" className={`lab-btn ${arbMode === 'independent' ? 'active' : ''}`} onClick={() => setArbMode('independent')}>
              ③ 独立请求方式
            </button>
            {arbMode === 'counter' && (
              <label style={{ fontSize: 12.5, marginLeft: 'auto' }}>
                计数器初值：
                <select className="lab-select" style={{ marginLeft: 4 }} value={counterStart} onChange={(e) => setCounterStart(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>从设备 {n} 开始轮询</option>
                  ))}
                </select>
              </label>
            )}
            {arbMode === 'daisy' && (
              <label style={{ fontSize: 12.5, marginLeft: 'auto' }}>
                注入链故障：
                <select
                  className="lab-select"
                  style={{ marginLeft: 4 }}
                  value={brokenDev === null ? 'none' : String(brokenDev)}
                  onChange={(e) => setBrokenDev(e.target.value === 'none' ? null : Number(e.target.value))}
                >
                  <option value="none">无故障</option>
                  <option value="0">设备 1 断链</option>
                  <option value="1">设备 2 断链</option>
                  <option value="2">设备 3 断链</option>
                </select>
              </label>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {[0, 1, 2, 3].map((idx) => {
              const isReq = reqs[idx];
              const isWin = winner === idx;
              const isBroken = arbMode === 'daisy' && brokenDev === idx;
              return (
                <div
                  key={idx}
                  className="lab-subpanel mono"
                  style={{
                    borderColor: isBroken ? '#ff6b6b' : isWin ? '#38d9a9' : isReq ? '#ffb03b' : '#2a3f56',
                    background: isBroken ? 'rgba(255,107,107,0.16)' : isWin ? 'rgba(56,217,169,0.16)' : '#14202e',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ color: '#ffffff' }}>设备 {idx + 1}</strong>
                    <span style={{ fontSize: 10.5, color: isWin ? '#38d9a9' : isBroken ? '#ff6b6b' : '#8ea5be' }}>
                      {isBroken ? '✗ 故障' : isWin ? '★ 获授权' : `位置 #${idx + 1}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`lab-btn ${isReq ? 'primary' : ''}`}
                    style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                    onClick={() => toggleReq(idx)}
                  >
                    {isReq ? '已发请求 (BR=1)' : '点击发起请求'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="lab-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="lab-metric">
              <div className="lab-metric-k">所需控制线数（n=4）</div>
              <div className="lab-metric-v" style={{ fontSize: 15, color: '#4ea1ff' }}>{lineCount}</div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">优先级灵活性</div>
              <div className="lab-metric-v" style={{ fontSize: 15, color: '#ffb03b' }}>
                {arbMode === 'daisy' ? '固定（越近越高）' : '可编程动态调整'}
              </div>
            </div>
            <div className="lab-metric">
              <div className="lab-metric-k">故障敏感度 / 速度</div>
              <div className="lab-metric-v" style={{ fontSize: 15, color: '#38d9a9' }}>
                {arbMode === 'daisy' ? '对断链极敏感' : arbMode === 'counter' ? '中等速度' : '响应最快'}
              </div>
            </div>
          </div>

          <div className="lab-status-bar">{pathText}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="lab-toolbar" style={{ marginBottom: 0 }}>
            <button type="button" className={`lab-btn ${handshake === 'none' ? 'active' : ''}`} onClick={() => setHandshake('none')}>
              (a) 不互锁方式
            </button>
            <button type="button" className={`lab-btn ${handshake === 'half' ? 'active' : ''}`} onClick={() => setHandshake('half')}>
              (b) 半互锁方式
            </button>
            <button type="button" className={`lab-btn ${handshake === 'full' ? 'active' : ''}`} onClick={() => setHandshake('full')}>
              (c) 全互锁方式（最可靠）
            </button>
          </div>

          <div className="lab-subpanel">
            <svg viewBox="0 0 600 155" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <text x="12" y="42" fill="#4ea1ff" fontSize="13" fontFamily="monospace">请求 (主)</text>
              <text x="12" y="116" fill="#38d9a9" fontSize="13" fontFamily="monospace">回答 (从)</text>
              {/* Request wave */}
              <polyline
                fill="none"
                stroke="#4ea1ff"
                strokeWidth="2.5"
                points={
                  handshake === 'none'
                    ? '95,55 150,55 150,22 280,22 280,55 560,55'
                    : handshake === 'half'
                    ? '95,55 150,55 150,22 330,22 330,55 560,55'
                    : '95,55 150,55 150,22 330,22 330,55 560,55'
                }
              />
              {/* Ack wave */}
              <polyline
                fill="none"
                stroke="#38d9a9"
                strokeWidth="2.5"
                points={
                  handshake === 'none'
                    ? '95,128 220,128 220,94 370,94 370,128 560,128'
                    : handshake === 'half'
                    ? '95,128 220,128 220,94 420,94 420,128 560,128'
                    : '95,128 220,128 220,94 430,94 430,128 560,128'
                }
              />
              {/* Causal arrows */}
              <line x1="150" y1="30" x2="218" y2="92" stroke="#ffb03b" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="172" y="72" fill="#ffb03b" fontSize="11" fontFamily="monospace">①触发回答</text>
              {(handshake === 'half' || handshake === 'full') && (
                <>
                  <line x1="224" y1="94" x2="328" y2="54" stroke="#ffb03b" strokeWidth="1.5" strokeDasharray="4 3" />
                  <text x="255" y="83" fill="#ffb03b" fontSize="11" fontFamily="monospace">②撤销请求</text>
                </>
              )}
              {handshake === 'full' && (
                <>
                  <line x1="332" y1="55" x2="428" y2="125" stroke="#ffb03b" strokeWidth="1.5" strokeDasharray="4 3" />
                  <text x="372" y="86" fill="#ffb03b" fontSize="11" fontFamily="monospace">③撤销回答</text>
                </>
              )}
            </svg>
          </div>

          <div className="lab-status-bar">
            {handshake === 'none' && '不互锁：主设备发请求后，不等回答固定时间后自行撤销；从设备发回答后也自行撤销，双方互不制约，速度较快但可靠性最低。'}
            {handshake === 'half' && '半互锁：主设备必须收到从设备回答后才撤销请求（有互锁），但从设备不等待请求撤销就自行撤销回答（无互锁）。'}
            {handshake === 'full' && '全互锁：主设备收到回答才撤销请求，从设备确认请求已撤销后才撤销回答，形成完整闭环握手，可靠性最高，适应速度悬殊的部件！'}
          </div>
        </div>
      )}
    </LabFrame>
  );
}
