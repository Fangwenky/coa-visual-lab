import React, { useState } from 'react';
import { CheckCircle2, Cpu, BookOpen } from 'lucide-react';
import { MODULES } from '../data/courseMeta';
import type { RouteId } from '../types/course';

export default function OverviewView({
  doneSet,
  onNavigate,
}: {
  doneSet: Set<string>;
  onNavigate: (id: RouteId, anchor?: string) => void;
}) {
  const [hoverUnit, setHoverUnit] = useState<string>('cpu');

  const unitInfo: Record<string, { title: string; desc: string; route: RouteId }> = {
    overview: {
      title: '存储程序整机体系（模块一）',
      desc: '冯·诺依曼五大部件、软硬件逻辑等价、CPU 性能公式（IC × CPI / f）与系列机软件兼容。',
      route: 'm1',
    },
    alu: {
      title: '运算器与数据表示（模块二）',
      desc: '原/反/补/移码、IEEE 754 浮点解剖、双符号位溢出、CLA 超前进位、Booth 乘与加减交替除。',
      route: 'm2',
    },
    isa: {
      title: '指令系统与寻址（模块三）',
      desc: '扩展操作码、Huffman 优化编码、9 种寻址路径追踪、软堆栈 SP 与子程序递归、CISC vs RISC。',
      route: 'm3',
    },
    mem: {
      title: '多级存储系统（模块四）',
      desc: '大小端与边界对齐、DRAM 三种刷新、主存字/位扩展与片选译码、Cache 三种映射与 LRU/FIFO。',
      route: 'm4',
    },
    cpu: {
      title: '中央处理器与流水线（模块五）',
      desc: '单总线微操作序列、微指令字段直接编码压缩、5 段流水线三大冒险与 4 段浮点累加时空图。',
      route: 'm5',
    },
    io: {
      title: '总线、中断与 I/O（模块六）',
      desc: '三种集中式总线仲裁、7 种磁记录编码示波器、多重中断屏蔽字软升级与 DMA 周期挪用。',
      route: 'm6',
    },
  };

  const curInfo = unitInfo[hoverUnit] || unitInfo.cpu;

  return (
    <div className="overview-wrap">
      <section className="hero-blueprint">
        <div>
          <h1>计算机组成与结构可视化学习工作台</h1>
          <p>
            完整覆盖《计算机组成与结构》全六章 <strong>416 页</strong> 课程课件（W1–W6），将原补移码、IEEE 754、超前进位、Booth 乘除、寻址路径、DRAM 刷新、Cache 映射、单总线微操作、微指令压缩、流水线冒险、磁记录波形、中断屏蔽软升级与 DMA 全部做成可单步、可试错的交互式硬件实验台。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            <button type="button" className="action-btn" style={{ background: 'var(--cobalt)', color: '#fff', borderColor: 'var(--cobalt)' }} onClick={() => onNavigate('m1')}>
              从模块一开始系统复习
            </button>
            <button type="button" className="action-btn" onClick={() => onNavigate('formulas')}>
              <BookOpen size={15} /> 打开考前核心公式速查表
            </button>
          </div>
          <div className="hero-stats">
            <div>
              <strong>6</strong>
              完整知识模块
            </div>
            <div>
              <strong>416</strong>
              课件逐页全覆盖
            </div>
            <div>
              <strong>20</strong>
              交互式硬件实验台
            </div>
            <div>
              <strong>{doneSet.size}/6</strong>
              当前复习进度
            </div>
          </div>
        </div>

        {/* Interactive Von Neumann Hardware Blueprint */}
        <div
          style={{
            background: 'var(--silicon)',
            border: '1px solid var(--silicon-border)',
            borderRadius: 8,
            padding: 16,
            color: 'var(--silicon-text)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--sig-green)' }}>
              整机交互硬件拓扑图（悬停查看 · 点击直达模块）
            </span>
            <Cpu size={16} color="#4ea1ff" />
          </div>

          <svg viewBox="0 0 460 265" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* System Bus Spine */}
            <rect x="20" y="162" width="420" height="22" rx="4" fill="#182a3e" stroke="#4ea1ff" strokeWidth="1.5" />
            <text x="230" y="177" textAnchor="middle" fill="#82bfff" fontSize="11" fontFamily="monospace" fontWeight="700">
              系统总线（地址总线 AB · 数据总线 DB · 控制总线 CB）
            </text>

            {/* Connecting vertical lines to bus */}
            <line x1="115" y1="138" x2="115" y2="162" stroke="#4ea1ff" strokeWidth="2" />
            <line x1="355" y1="138" x2="355" y2="162" stroke="#38d9a9" strokeWidth="2" />
            <line x1="230" y1="184" x2="230" y2="206" stroke="#ffb03b" strokeWidth="2" />

            {/* Host / CPU Box */}
            <rect x="20" y="14" width="235" height="124" rx="6" fill="#111d2a" stroke="#2d445d" strokeDasharray="4 3" />
            <text x="30" y="31" fill="#8ea5be" fontSize="10.5" fontFamily="monospace">CPU 中央处理器</text>

            {/* ALU Block -> M2 */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverUnit('alu')}
              onClick={() => onNavigate('m2')}
            >
              <rect
                x="30"
                y="40"
                width="102"
                height="44"
                rx="4"
                fill={hoverUnit === 'alu' ? 'rgba(78,161,255,0.28)' : '#162637'}
                stroke={hoverUnit === 'alu' ? '#4ea1ff' : '#324a64'}
                strokeWidth="1.5"
              />
              <text x="81" y="59" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">运算器 ALU</text>
              <text x="81" y="75" textAnchor="middle" fill="#82bfff" fontSize="10" fontFamily="monospace">模块二 · 数据计算</text>
            </g>

            {/* Control Unit & Pipeline -> M5 */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverUnit('cpu')}
              onClick={() => onNavigate('m5')}
            >
              <rect
                x="142"
                y="40"
                width="103"
                height="44"
                rx="4"
                fill={hoverUnit === 'cpu' ? 'rgba(56,217,169,0.25)' : '#162637'}
                stroke={hoverUnit === 'cpu' ? '#38d9a9' : '#324a64'}
                strokeWidth="1.5"
              />
              <text x="193" y="59" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">控制器/流水线</text>
              <text x="193" y="75" textAnchor="middle" fill="#38d9a9" fontSize="10" fontFamily="monospace">模块五 · CPU核心</text>
            </g>

            {/* ISA Interface -> M3 */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverUnit('isa')}
              onClick={() => onNavigate('m3')}
            >
              <rect
                x="30"
                y="92"
                width="215"
                height="36"
                rx="4"
                fill={hoverUnit === 'isa' ? 'rgba(177,151,252,0.25)' : '#162637'}
                stroke={hoverUnit === 'isa' ? '#b197fc' : '#324a64'}
                strokeWidth="1.5"
              />
              <text x="137" y="114" textAnchor="middle" fill="#e5dbff" fontSize="11.5" fontWeight="700">
                指令集体系结构 ISA &amp; 寻址（模块三）
              </text>
            </g>

            {/* Memory Hierarchy -> M4 */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverUnit('mem')}
              onClick={() => onNavigate('m4')}
            >
              <rect
                x="270"
                y="14"
                width="170"
                height="124"
                rx="6"
                fill={hoverUnit === 'mem' ? 'rgba(56,217,169,0.22)' : '#142231'}
                stroke={hoverUnit === 'mem' ? '#38d9a9' : '#324a64'}
                strokeWidth="1.5"
              />
              <text x="355" y="42" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">多级存储系统</text>
              <text x="355" y="64" textAnchor="middle" fill="#38d9a9" fontSize="10.5" fontFamily="monospace">Cache · SRAM · DRAM</text>
              <text x="355" y="84" textAnchor="middle" fill="#8ea5be" fontSize="10.5" fontFamily="monospace">主存扩展 · 虚拟存储</text>
              <rect x="305" y="98" width="100" height="24" rx="4" fill="#0d1620" stroke="#38d9a9" />
              <text x="355" y="114" textAnchor="middle" fill="#38d9a9" fontSize="10.5" fontFamily="monospace">模块四 →</text>
            </g>

            {/* Bus, Interrupt & I/O -> M6 */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverUnit('io')}
              onClick={() => onNavigate('m6')}
            >
              <rect
                x="20"
                y="206"
                width="290"
                height="48"
                rx="6"
                fill={hoverUnit === 'io' ? 'rgba(255,176,59,0.22)' : '#142231'}
                stroke={hoverUnit === 'io' ? '#ffb03b' : '#324a64'}
                strokeWidth="1.5"
              />
              <text x="165" y="227" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="700">
                总线仲裁 · 磁盘磁记录 · 中断屏蔽 · DMA
              </text>
              <text x="165" y="244" textAnchor="middle" fill="#ffb03b" fontSize="10.5" fontFamily="monospace">
                模块六 · 输入输出与外设互联
              </text>
            </g>

            {/* System Overview -> M1 */}
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverUnit('overview')}
              onClick={() => onNavigate('m1')}
            >
              <rect
                x="322"
                y="206"
                width="118"
                height="48"
                rx="6"
                fill={hoverUnit === 'overview' ? 'rgba(78,161,255,0.25)' : '#142231'}
                stroke={hoverUnit === 'overview' ? '#4ea1ff' : '#324a64'}
                strokeWidth="1.5"
              />
              <text x="381" y="227" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">系统概论/性能</text>
              <text x="381" y="244" textAnchor="middle" fill="#82bfff" fontSize="10.5" fontFamily="monospace">模块一 · 铁律</text>
            </g>
          </svg>

          <div
            style={{
              marginTop: 10,
              padding: '9px 11px',
              borderRadius: 5,
              background: '#14202e',
              borderLeft: '3px solid #4ea1ff',
              fontSize: 12.5,
            }}
          >
            <strong style={{ color: '#ffffff' }}>{curInfo.title}：</strong>
            <span style={{ color: '#b7c7d9' }}>{curInfo.desc}</span>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>六大课程模块导航</h2>
        <span className="mono" style={{ fontSize: 12.5, color: 'var(--slate)' }}>
          点击任意模块进入精讲与交互实验
        </span>
      </div>

      <div className="module-catalog">
        {MODULES.map((mod) => {
          const isDone = doneSet.has(mod.id);
          const labSections = mod.sections.filter((s) => s.isLab);
          return (
            <button
              key={mod.id}
              type="button"
              className="module-tile"
              onClick={() => onNavigate(mod.id)}
            >
              <div className="module-tile-top">
                <span>
                  {mod.code} · {mod.slideCount} 页课件
                </span>
                {isDone ? (
                  <span style={{ color: 'var(--emerald)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={14} /> 已掌握
                  </span>
                ) : (
                  <span style={{ color: 'var(--slate)' }}>{mod.labCount} 个实验台</span>
                )}
              </div>
              <h3>{mod.title}</h3>
              <p>{mod.summary}</p>
              <div className="module-tile-labs">
                {labSections.map((ls) => (
                  <span key={ls.id} className="lab-pill">
                    {ls.title.replace(/^实验 \d+\.\d+：/, '')}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
