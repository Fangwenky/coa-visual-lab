import React from 'react';
import {
  ConceptSection,
  DatasheetTable,
  ExamTip,
  FormulaBox,
  ModuleFooterNav,
  ModuleHeader,
  QuizBlock,
  WorkedExample,
} from '../components/DocBlocks';
import { MODULES } from '../data/courseMeta';
import EndianAlignLab from '../labs/m4/EndianAlignLab';
import DramRefreshLab from '../labs/m4/DramRefreshLab';
import MemExpansionLab from '../labs/m4/MemExpansionLab';
import CacheSimulatorLab from '../labs/m4/CacheSimulatorLab';
import type { QuizQuestion, RouteId } from '../types/course';

const M4_QUIZ: QuizQuestion[] = [
  {
    id: 'm4-q1',
    question: '某计算机 Cache 共有 16 块，采用 2 路组相联映像，每块 32 字节（按字节编址），则主存 129 号单元应装入 Cache 的哪一组？',
    options: ['第 1 组', '第 2 组', '第 4 组', '第 0 组'],
    answerIndex: 2,
    explanation: '课件 P61 原题：主存块号 = ⌊129 / 32⌋ = 4；Cache 组数 = 16 / 2 = 8 组；目标组号 = 4 mod 8 = 第 4 组。',
  },
  {
    id: 'm4-q2',
    question: 'CPU 执行某程序，Cache 存取 1900 次，主存存取 100 次；Cache 周期 50ns，主存周期 250ns。贯通查找式与旁路式的平均访问时间分别为？',
    options: ['62.5ns 和 60ns', '60ns 和 62.5ns', '55ns 和 50ns', '65ns 和 60ns'],
    answerIndex: 0,
    explanation: '课件 P68 原题：命中率 H = 1900/2000 = 95%。贯通查找式 = 50 + 0.05×250 = 62.5ns；旁路式 = 0.95×50 + 0.05×250 = 60ns。',
  },
  {
    id: 'm4-q3',
    question: '关于多体单字交叉存储器中的“高位交叉”与“低位交叉”，下列描述正确的是？',
    options: [
      '高位交叉主要用于提高访存速度，低位交叉主要用于扩大容量',
      '高位交叉主要用于扩大容量，低位交叉利用流水线分时启动提高访存带宽',
      '两者都不需要各自独立的 MAR 与 MDR',
      '低位交叉使相邻地址落在同一个存储体内',
    ],
    answerIndex: 1,
    explanation: '课件 P43–P46：高位交叉把连续地址放在同一存储体，受局部性影响往往只有一体忙碌，主要用于扩容量；低位交叉按模 n 把相邻地址分散到不同体，实现流水线并行加速！',
  },
  {
    id: 'm4-q4',
    question: 'DRAM 芯片 2164（64K×1）只有 8 根地址引脚 A7~A0 却能寻址 64K 单元，其核心技术是？若地址引脚增加 1 根，芯片容量将变为原来的几倍？',
    options: ['全译码技术；2 倍', '行列地址分时复用（RAS/CAS）；4 倍', '线选技术；4 倍', '双端口技术；2 倍'],
    answerIndex: 1,
    explanation: '课件 P20 经典思考题！DRAM 采用 RAS/CAS 行列地址分时复用，8 根线提供 16 位地址（2¹⁶=64K）；地址引脚增加 1 根相当于行和列各增 1 位，总地址多 2 位，容量扩大 4 倍！',
  },
];

export default function Module4View({
  isDone,
  onToggleDone,
  onNavigate,
}: {
  isDone: boolean;
  onToggleDone: (id: string) => void;
  onNavigate: (id: RouteId) => void;
}) {
  const meta = MODULES[3];

  return (
    <div>
      <ModuleHeader meta={meta} />

      <ConceptSection id="m4-hierarchy" title="1. 存储层次结构、局部性原理与存储器分类" slideRef="W4 · P3–P7">
        <div className="prose">
          <p>
            为了调和<strong>速度、容量与价格</strong>三者之间的矛盾，计算机利用程序访问的<strong>局部性原理</strong>构建金字塔形多级存储体系（寄存器 → 片上/二级 Cache → 主存 DRAM → 辅存磁盘/磁带）：
          </p>
          <ul>
            <li><strong>时间局部性</strong>：最近访问的存储单元在不久的将来仍可能被再次访问（如循环体、累加变量）。</li>
            <li><strong>空间局部性</strong>：下次访问的单元很可能就在刚刚访问单元的附近（如顺序指令、数组元素）。</li>
            <li><strong>三级两层体系</strong>：<strong>Cache–主存层次</strong>（解决 CPU 与主存速度差，硬件透明管理）与 <strong>主存–辅存层次</strong>（虚拟存储系统，解决容量不足，软硬件协同管理）。</li>
          </ul>
        </div>
        <DatasheetTable
          headers={['分类维度', '具体类别与典型特征']}
          rows={[
            ['按存取方式', 'RAM（随机存取，任一单元存取时间相同）、ROM（只读，非易失）、SAM（顺序存取，磁带）、DAM（直接存取，磁盘先寻道再等待）。'],
            ['按存储介质', '磁芯（破坏性读出须重写/再生）、半导体（双极型 TTL/ECL 与 MOS 型）、磁表面（磁盘/磁带）、光存储器（CD-ROM/WORM/CD-RW）。'],
          ]}
        />
      </ConceptSection>

      <ConceptSection id="m4-main-mem" title="2. 主存组织、大小端、技术指标与边界对齐" slideRef="W4 · P8–P17">
        <div className="prose">
          <p>
            主存由<strong>存储体</strong>、<strong>地址译码驱动电路</strong>和<strong>I/O 及读写电路</strong>三部分构成。存取速度需严格区分<strong>存取时间 Ta</strong>（启动到完成读写）与<strong>存取周期 Tm</strong>（连续两次访存最短间隔，含恢复期，故 <code>Tm &gt; Ta</code>）。
          </p>
        </div>

        <FormulaBox
          label="主存带宽公式与 DDR400 实例（P13）"
          formula={`主存带宽 Bm = 内存时钟频率 × 倍增系数 × 主存位宽 ÷ 8
例：DDR400 运行频率 200MHz，上下沿均传数据（倍增=2），64bit 位宽：
Bm = 200 × 2 × 64 ÷ 8 = 3200 MB/s = 3.2 GB/s`}
          note="提高带宽三大途径：缩短存取周期 Tm、增加存储字长、增加存储体（多体交叉）。"
        />

        <EndianAlignLab />
      </ConceptSection>

      <ConceptSection id="m4-sram-dram" title="3. SRAM / DRAM / ROM 与 DRAM 刷新机制" slideRef="W4 · P18–P27">
        <DatasheetTable
          headers={['对比项', '静态 RAM (SRAM，如 Intel 2114 1K×4)', '动态 RAM (DRAM，如 2164 64K×1)']}
          rows={[
            ['存储原理', '双稳态触发器（6管）', 'MOS 栅极电容电荷（1管+1电容）'],
            ['集成度 / 功耗 / 速度', '集成度低、功耗大、速度极快', '集成度极高、功耗小、速度较慢'],
            ['典型用途', '高速缓冲存储器 Cache', '主存储器（内存条）'],
            ['地址线与刷新', '无复用，无需刷新', '行列地址分时复用（RAS/CAS），必须定时按行刷新（DDR 典型 64ms）'],
          ]}
        />
        <div className="prose">
          <p>
            <strong>ROM 家族（非易失性）</strong>：掩膜式 MROM（出厂固化）→ 一次可编程 PROM（熔丝型）→ 可擦除 EPROM（UVEPROM 紫外线 / EEPROM 电擦除）→ 闪速存储器 Flash（在线擦除，U 盘与 SSD 核心）。
          </p>
        </div>
        <DramRefreshLab />
      </ConceptSection>

      <ConceptSection id="m4-expansion" title="4. 主存字/位扩展、双译码与片选逻辑" slideRef="W4 · P28–P39">
        <div className="prose">
          <p>
            设计主存解决三件事：① 算芯片数 <code>总片数 = 总容量 / 芯片容量</code>（RAM/ROM 分算）；② <strong>位扩展</strong>（地址/片选/读写并联，数据线分接）、<strong>字扩展</strong>（地址/数据/读写并联，高位片选区分）、或<strong>字位同时扩展</strong>；③ <strong>字选（片内双译码重合法 X/Y 交叉大幅减少译码输出线）</strong>与<strong>片选（线选法 / 全译码法 / 部分译码法）</strong>。
          </p>
        </div>
        <DatasheetTable
          headers={['片选方法', '连接原理', '优点', '缺点']}
          rows={[
            ['线选法', '高位地址线直接（或反相）接各片 CS，每次仅允许一位有效', '无需译码器，电路最简', '地址空间不连续，高位利用率低，易误选冲突'],
            ['全译码法', '片内寻址外的全部高位地址送入译码器产生 CS', '地址唯一、连续、无重叠、易扩展', '译码硬件开销最高'],
            ['部分译码法', '仅取部分高位地址译码，其余高位悬空未用', '节省译码逻辑', '产生大量地址重叠区（未用高位全 0 为基本地址）'],
          ]}
        />
        <MemExpansionLab />
      </ConceptSection>

      <ConceptSection id="m4-parallel" title="5. 提速技术：双端口与多体交叉并行主存" slideRef="W4 · P40–P46">
        <div className="compare-grid">
          <div className="compare-panel">
            <h4>双端口存储器与单体多字</h4>
            <ul>
              <li><strong>双端口存储器</strong>：同一存储体配两套独立地址/数据/控制线，可同时读写不同单元；读写同一单元时需硬件仲裁。</li>
              <li><strong>单体多字</strong>：字长扩大为 <code>n×W</code>，单周期读出 n 个字，<code>Bm = nW/Tm</code>；适合连续存放，但遇转移或写单字时冲突大。</li>
            </ul>
          </div>
          <div className="compare-panel">
            <h4>多体单字交叉：高位 vs 低位</h4>
            <ul>
              <li><strong>高位交叉</strong>：高位地址选体号，连续地址集中在同一体，主要目的是<strong>扩大主存容量</strong>。</li>
              <li><strong>低位交叉</strong>：低位地址选体号（模 4 编址：M0 存 0,4,8…；M1 存 1,5,9…），各体分时流水启动，理论上访存带宽提高 <strong>n 倍</strong>！</li>
            </ul>
          </div>
        </div>
      </ConceptSection>

      <ConceptSection id="m4-cache" title="6. Cache 工作原理、地址映像、替换写策略与虚拟存储器" slideRef="W4 · P47–P69">
        <div className="prose">
          <p>
            Cache 与主存均等分为相同大小的<strong>块</strong>，系统核心解决三大问题：<strong>① 定位（地址映像）</strong>、<strong>② 替换算法（随机 / FIFO / LRU）</strong>、<strong>③ 数据一致性（写直达法 Write-Through vs 写回法 Write-Back）</strong>。
          </p>
        </div>

        <DatasheetTable
          headers={['地址映像方式', '映像规则', '主存地址划分', '优缺点对比']}
          rows={[
            ['全相联映像', '主存任意块可装入 Cache 任意位置', '标记 Tag | 块内地址', '块冲突最低、利用率最高；但需全相联查表，硬件成本极高'],
            ['直接映像', 'Cache 块号 b = 主存块号 B mod Cache块数', '标记 Tag | Cache块号 | 块内地址', '硬件最简、查表与取数可并行；但块冲突率极高、易抖动'],
            ['S 路组相联映像', 'Cache 分 G 组每组 S 块，组号 = B mod G（组间直接、组内全相联）', '标记 Tag | 组号 Set | 块内地址', '折衷最优！S=1 退化为直接映像，S=块数 退化为全相联'],
          ]}
        />

        <WorkedExample title="课件经典地址划分例题（P65）">
          Cache 容量 64KB，块大小 16B，主存容量 4MB，直接相联映射：
          <br />
          ① 主存地址共 <code>log₂(4MB) = 22 位</code>（21~0）；块内地址 <code>log₂(16) = 4 位</code>（3~0）；Cache 块数 <code>64KB/16B = 4096 = 2¹²</code> ⇒ 区内块号 <strong>12 位</strong>（15~4）；标记 Tag = <code>22 - 12 - 4 = 6 位</code>（21~16）。
          <br />
          ② Cache 地址共 <code>16 位</code>：块号 12 位（15~4）+ 块内地址 4 位（3~0）。
        </WorkedExample>

        <FormulaBox
          label="Cache 平均访问时间（P66–P68 必考区分！）"
          formula={`贯通查找式（Look-Through，先查Cache不中再访主存）：T_avg = T_cache + (1 - H) × T_mem
旁路式（Look-Aside，同时向Cache和主存发请求）：      T_avg = H × T_cache + (1 - H) × T_mem`}
          note="贯通式降低主存总线请求，但未命中时叠加了 Cache 查询延迟；旁路式未命中无额外延迟，但每次都占用主存总线。"
        />

        <CacheSimulatorLab />

        <ExamTip title="虚拟存储器核心概念（P69）">
          虚拟存储器由<strong>主存 + 联机辅存（磁盘）</strong>在硬件与操作系统共同管理下构成，向应用程序员呈现单一超大逻辑地址空间；按管理方式分为<strong>页式、段式、段页式</strong>三种虚拟存储器，地址变换思想与 Cache–主存层次类似（页表/TLB 快表）。
        </ExamTip>
        <QuizBlock questions={M4_QUIZ} />
      </ConceptSection>

      <ModuleFooterNav
        moduleId="m4"
        isDone={isDone}
        onToggleDone={onToggleDone}
        prev={{ id: 'm3', label: '模块三：指令系统' }}
        next={{ id: 'm5', label: '模块五：中央处理器' }}
        onNavigate={onNavigate}
      />
    </div>
  );
}
