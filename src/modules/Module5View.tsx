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
import SingleBusDatapathLab from '../labs/m5/SingleBusDatapathLab';
import MicrocodeEncodingLab from '../labs/m5/MicrocodeEncodingLab';
import PipelineHazardLab from '../labs/m5/PipelineHazardLab';
import type { QuizQuestion, RouteId } from '../types/course';

const M5_QUIZ: QuizQuestion[] = [
  {
    id: 'm5-q1',
    question: '某微程序控制器共有 256 个微命令，若采用字段直接编码法且每 4 位为一个编码段（每段留出全 0 表示无操作），则至少需要多少个段、操作控制字段总长多少位？',
    options: ['16 段，64 位', '18 段，72 位', '8 段，32 位', '32 段，128 位'],
    answerIndex: 1,
    explanation: '课件 P45 原题！4 位一段有 2⁴ - 1 = 15 个有效微命令（全 0 留作无操作），⌈256 / 15⌉ = 18 段，总位宽 = 18 × 4 = 72 位！',
  },
  {
    id: 'm5-q2',
    question: '在微程序控制器中，下列说法错误的是？',
    options: [
      '一条机器指令通常对应控制存储器（CM）中的一段微程序',
      '微程序对汇编语言和高级语言程序员是透明的',
      '水平型微指令并行性强、微指令字短；垂直型微指令字长、并行性差',
      '字段直接编码法应把互斥微命令分在同一段、兼容微命令分在不同段',
    ],
    answerIndex: 2,
    explanation: '课件 P56 易混点！正好相反：水平型微指令并行性强、微指令字较“长”；垂直型微指令一次仅执行一个微命令、微指令字较“短”！',
  },
  {
    id: 'm5-q3',
    question: '流水线中，一条指令依赖前面尚未写回寄存器的运算结果，这种冒险属于？最常用的零停顿硬件解决措施是？',
    options: [
      '结构冒险；分离指令与数据 Cache',
      '数据冒险；旁路前递（Forwarding）通路',
      '控制冒险；分支预测',
      '数据冒险；插入 NOP 气泡',
    ],
    answerIndex: 1,
    explanation: '写后读依赖属于数据冒险；插入 NOP 气泡会损失周期，而旁路前递（Forwarding）可把 EX/MEM 产出结果直接送入下条指令 ALU 实现零停顿。',
  },
  {
    id: 'm5-q4',
    question: '一条 4 段流水线各段耗时均为 Δt，无相关连续执行 100 条指令时，流水线耗时与理论最大加速比趋近于？',
    options: ['400Δt；加速比 1', '103Δt；理论最大加速比趋近段数 4', '104Δt；加速比 2', '100Δt；加速比 8'],
    answerIndex: 1,
    explanation: '等长 k 段流水执行 n 个无相关任务耗时 (k + n - 1)Δt = 103Δt；当 n→∞ 时加速比 Sp = nk/(k+n-1) → k（即流水线段数 4）。',
  },
];

export default function Module5View({
  isDone,
  onToggleDone,
  onNavigate,
}: {
  isDone: boolean;
  onToggleDone: (id: string) => void;
  onNavigate: (id: RouteId) => void;
}) {
  const meta = MODULES[4];

  return (
    <div>
      <ModuleHeader meta={meta} />

      <ConceptSection id="m5-cpu-org" title="1. CPU 的功能组成、专用寄存器与 PSWR 标志位" slideRef="W5 · P3–P7">
        <div className="prose">
          <p>
            从硬件设计角度，<strong>CPU = 数据通路（执行部件：寄存器、ALU、内部总线）+ 控制器（控制部件：译码器、时序逻辑、CU）</strong>。四大核心功能：指令控制、操作控制、时间控制、数据加工。
          </p>
        </div>
        <DatasheetTable
          headers={['5 个必备专用寄存器', '英文全称', '核心职责']}
          rows={[
            ['PC', '程序计数器', '保存下一条将要执行指令的主存地址（顺序执行时自动递增）。'],
            ['IR', '指令寄存器', '暂存当前从主存取出正在执行的机器指令，供 ID 译码。'],
            ['MAR', '存储器地址寄存器', '存放当前欲访问主存单元的地址，接至地址总线。'],
            ['MDR', '存储器数据寄存器', '暂存与主存交换的数据或指令，接至数据总线。'],
            ['PSWR', '状态标志寄存器', '状态标志位（自动设置）：CF(进位)、OF(溢出)、ZF(零值)、SF(符号)、PF(奇偶)；控制位（程序指定）：TF(跟踪)、IF(允许中断)、I/O 特权等。'],
          ]}
        />
      </ConceptSection>

      <ConceptSection id="m5-cu-timing" title="2. 控制器实现方式、多级时序系统与控制方式" slideRef="W5 · P9–P25">
        <DatasheetTable
          headers={['控制器实现方式', '硬件原理', '优势', '劣势']}
          rows={[
            ['组合逻辑型（硬布线）', '复杂门电路树形网络直接产出微操作信号', '执行速度最快（RISC 首选）', '结构不规整，设计/调试/扩充极难'],
            ['存储逻辑型（微程序）', '微操作代码化为微指令，存入控制存储器 CM', '设计规整、易修改扩充指令（CISC 主流）', '多一级控存访问，速度比硬布线慢'],
            ['组合+存储结合型 (PLA)', '可编程逻辑阵列结合两者', '兼顾速度与规整度', '阵列规模受限'],
          ]}
        />

        <div className="compare-grid">
          <div className="compare-panel">
            <h4>三级时序系统与节拍选取（P17–P23）</h4>
            <ul>
              <li><strong>层次</strong>：<code>指令周期 = i × 机器周期(CPU周期)</code> → <strong>节拍电位</strong> → <strong>工作脉冲</strong>（微型机常用机器周期+时钟周期二级制，如 8086 可插入等待周期 <code>Tw</code>）。</li>
              <li><strong>节拍选取</strong>：① 统一节拍法（定长 CPU 周期，以最繁周期为准）；② 分散节拍法（不定长）；③ 延长节拍法；④ 时钟周期插入。</li>
            </ul>
          </div>
          <div className="compare-panel">
            <h4>CPU 三种控制方式（P24–P25）</h4>
            <ul>
              <li><strong>同步控制（集中）</strong>：统一固定时钟节拍，设计简单，但简单指令存在空闲浪费。</li>
              <li><strong>异步控制（分散）</strong>：按需占用时间，无时钟浪费、效率高，但应答控制复杂。</li>
              <li><strong>联合控制</strong>：现代主流——<strong>部件内部同步，部件之间异步</strong>。</li>
            </ul>
          </div>
        </div>
      </ConceptSection>

      <ConceptSection id="m5-micro-ops" title="3. 指令执行流程与单总线微操作序列" slideRef="W5 · P26–P31">
        <div className="prose">
          <p>
            每条指令执行都经历<strong>取指令（公共操作）→ 分析取数 → 执行</strong>三个阶段。在单总线 CPU 数据通路中，同一时刻总线上只能传输一个数据，因此 ALU 两侧必须设置输入暂存器 <code>Y</code> 与输出暂存器 <code>Z</code>。点击下方实验台单步追踪课件原题 <code>ADD @R0, R1</code> 与 <code>JC A</code>：
          </p>
        </div>
        <SingleBusDatapathLab />
      </ConceptSection>

      <ConceptSection id="m5-microprog" title="4. 微程序控制原理、微指令编码与地址形成" slideRef="W5 · P33–P56">
        <div className="prose">
          <p>
            <strong>两层架构</strong>：传统机器层（机器指令 → 主存，程序员可见）之下是微程序层（微指令 → 控制存储器 CM，对程序员透明）。层次关系：<code>程序 ⊃ 机器指令(=微程序) ⊃ 微指令(含操作控制字段+顺序控制字段) ⊃ 微命令(与微操作一一对应)</code>。微命令之间分<strong>兼容性</strong>（可同时发出）与<strong>互斥性</strong>（不可同时发出）。
          </p>
        </div>

        <DatasheetTable
          headers={['操作控制字段编码法', '位数长度（N 个微命令）', '并行能力与硬件译码']}
          rows={[
            ['1. 直接控制法（不译码）', 'N 位（1位对应1微命令）', '并行性最强、速度最快；微指令字太长、互斥位浪费严重'],
            ['2. 最短编码法', '⌈log₂ N⌉ 位', '微指令最短；同一拍仅能发 1 个微命令，完全丧失并行性！'],
            ['3. 字段直接编码法（显式）', '分若干互斥小段，每段留全0表无操作', '折衷主流！例 256 微命令按 4 位分段（每段15有效）需 18 段 = 72 位，可同时发 18 命令'],
            ['4. 字段间接编码法（隐式）', '比字段直接更短', '某段编码需联合另一字段才能唯一译码，译码更复杂'],
          ]}
        />

        <ExamTip title="字段直接编码法四大分段原则（P44 简答/计算必背）">
          ① <strong>互斥微命令同段，兼容微命令异段</strong>；② 与数据通路结构相适应；③ 每段位数不宜太多（防译码复杂）；④ <strong>每段必须留出一个状态（常为全 0）表示本字段不操作</strong>（如 3 位段最多表 7 个互斥命令）。
        </ExamTip>

        <MicrocodeEncodingLab />

        <div className="compare-grid">
          <div className="compare-panel">
            <h4>微程序控制器组成与微地址形成（P48–P55）</h4>
            <ul>
              <li><strong>四大特有部件</strong>：控制存储器（CM）、微指令寄存器（μIR）、微地址形成部件、微地址寄存器（μMAR）。</li>
              <li><strong>入口微地址（多路转移）</strong>：① 一级功能转换（固定位置 OP 直接拼位，如 <code>θ11B</code> 每段差 4 单元）；② 二级功能转换（先判指令类再判 OP）；③ PLA 转换（变长变位 OP）。</li>
              <li><strong>后继微地址</strong>：① 增量方式（μMAR 兼计数器 μPC+1 顺序 + 转移字段）；② 断定方式（高位非测试段定区域 + 低位测试段按状态分支）。</li>
            </ul>
          </div>
          <div className="compare-panel">
            <h4>水平型 vs 垂直型微指令（P56）</h4>
            <ul>
              <li><strong>水平型微指令</strong>：一次可并行定义多个微命令；效率高、微指令条数少、执行快；但字长较长（增大控存横向容量），须熟知数据通路。</li>
              <li><strong>垂直型微指令</strong>：一次仅完成 1 个基本微操作；字短、格式像机器指令易编程；但并行度差、微程序长、速度慢。</li>
            </ul>
          </div>
        </div>
      </ConceptSection>

      <ConceptSection id="m5-pipeline" title="5. 流水线基本原理、三大冒险、指标计算与分类" slideRef="W5 · P58–P79">
        <div className="prose">
          <p>
            流水线的本质是<strong>以重叠方式执行指令</strong>（对编程者透明）：它<strong>不缩短单条指令的执行时间</strong>，而是通过提升<strong>吞吐率</strong>缩短程序总执行时间。流水线时钟周期由<strong>最慢功能段</strong>决定；解决不平衡瓶颈的两大方法是<strong>细分瓶颈段</strong>与<strong>复制瓶颈段并联</strong>。
          </p>
        </div>

        <FormulaBox
          label="流水线三大定量性能指标（P70–P74 必考计算！）"
          formula={`吞吐率 TP = n / T流水          （等长 k 段无相关：T流水 = (k + n - 1)·Δt）
加速比 Sp = T非流水 / T流水    （理想无限长流：Sp → k，即等于流水线段数）
效  率 η  = (n个任务的时空区面积) / (m段总时空区面积) = T非流水 / (m · T流水)`}
          note="遇到有数据相关的复杂任务（如课件 P73 4段浮点加法求8数之和），务必先画时空图数出真实总周期 T流水（15Δt），再代入三式！"
        />

        <PipelineHazardLab />

        <DatasheetTable
          headers={['流水线分类维度', '具体类型与核心区别（P75–P79）']}
          rows={[
            ['按处理级别', '部件级（如浮点加法器 4 段流水）｜处理机级（取指/分析/执行指令流水）｜系统级（多处理机间宏流水）'],
            ['按功能数量', '单功能流水线（仅做一种运算）｜多功能流水线（同一组部件多种连法实现多种运算）'],
            ['多功能：静态 vs 动态', '静态流水线：同一时间内各段只能按同一种功能连接，切换功能必须先排空整条流水线；动态流水线：允许同一时间内不同段并行执行不同功能（如浮点加与定点乘交错），利用率更高但控制复杂！'],
          ]}
        />

        <QuizBlock questions={M5_QUIZ} />
      </ConceptSection>

      <ModuleFooterNav
        moduleId="m5"
        isDone={isDone}
        onToggleDone={onToggleDone}
        prev={{ id: 'm4', label: '模块四：存储系统' }}
        next={{ id: 'm6', label: '模块六：总线、中断与输入输出系统' }}
        onNavigate={onNavigate}
      />
    </div>
  );
}
