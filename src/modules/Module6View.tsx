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
import BusArbitrationLab from '../labs/m6/BusArbitrationLab';
import MagRecordingLab from '../labs/m6/MagRecordingLab';
import InterruptMaskLab from '../labs/m6/InterruptMaskLab';
import DmaTransferLab from '../labs/m6/DmaTransferLab';
import type { QuizQuestion, RouteId } from '../types/course';

const M6_QUIZ: QuizQuestion[] = [
  {
    id: 'm6-q1',
    question: '某总线一个总线周期并行传 4 字节，1 个总线周期等于 1 个时钟周期，总线时钟频率 33MHz，则总线带宽为？',
    options: ['66 MB/s', '132 MB/s', '264 MB/s', '33 MB/s'],
    answerIndex: 1,
    explanation: '课件 P9 原题：B = W × F / N = 4B × 33MHz / 1 = 132 MB/s。',
  },
  {
    id: 'm6-q2',
    question: '将较长文件存入多盘片硬盘时，若一条磁道存不完，操作系统应优先连续写入？',
    options: [
      '同一记录面的相邻几条磁道',
      '同一圆柱面上不同记录面的同号磁道',
      '随机分布在不同柱面的扇区',
      '最内圈的 0 号扇区',
    ],
    answerIndex: 1,
    explanation: '课件 P30 思考题！优先写同一圆柱面的各记录面，只需电子切换磁头而无需机械移动磁臂寻道，大幅节省寻道时间！',
  },
  {
    id: 'm6-q3',
    question: '在多重中断系统中，什么时候应当“开中断”（置中断允许触发器为 1）？',
    options: [
      '响应中断进入中断隐指令时立即开中断',
      '在中断服务程序“保护中断现场之后”，以及“恢复中断现场之后”',
      '在整个中断服务程序执行完毕返回主程序之后才允许开中断',
      '保护现场之前立刻开中断',
    ],
    answerIndex: 1,
    explanation: '课件 P62 & P67 必考时机！保护现场与恢复现场期间必须“关中断”防堆栈/寄存器混乱；多重中断在保护现场完毕后“开中断”以允许更高级中断嵌套，恢复现场前再次“关中断”，恢复完毕后“开中断”并返回。',
  },
  {
    id: 'm6-q4',
    question: '下列关于 DMA 方式与程序中断方式区别的描述，错误的是？',
    options: [
      '对中断请求的响应发生在每条指令执行完毕；对 DMA 请求的响应可发生在每个机器周期结束',
      'DMA 请求的优先级高于中断请求',
      'DMA 传送过程中每传一个字节都需要 CPU 暂停保护现场并执行中断服务程序',
      'DMA 块传送全部结束后，仍由 DMA 控制器发中断请求交由 CPU 做结尾后处理',
    ],
    answerIndex: 2,
    explanation: '课件 P69 & P79：DMA 传送过程完全由 DMA 控制器硬件完成循环，不保护/恢复 CPU 现场，不需要 CPU 干预；仅在预处理和整块传送结束的后处理阶段介入 CPU。',
  },
];

export default function Module6View({
  isDone,
  onToggleDone,
  onNavigate,
}: {
  isDone: boolean;
  onToggleDone: (id: string) => void;
  onNavigate: (id: RouteId) => void;
}) {
  const meta = MODULES[5];

  return (
    <div>
      <ModuleHeader meta={meta} />

      <ConceptSection id="m6-bus" title="1. 总线概念、指标、定时控制与总线仲裁" slideRef="W6 · P2–P23">
        <div className="prose">
          <p>
            <strong>总线（Bus）</strong>是连接各部件的公共信息通道，核心特点是<strong>分时共享</strong>（依赖<strong>三态门</strong>的 <code>0 / 1 / 高阻浮空 Z</code> 三态实现多设备挂接而不短路）。一次<strong>总线事务</strong>含地址阶段与数据阶段，由<strong>主设备</strong>发起支配，<strong>从设备</strong>配合交换。
          </p>
          <ul>
            <li><strong>分类</strong>：单向（地址总线）/ 双向（数据总线）；片内总线 / 系统总线 / 通信总线；并行总线 / 串行总线（高速下串行抗串扰与时钟偏斜，如 PCIe / SATA 反而更快！）。</li>
            <li><strong>结构演变</strong>：单总线 → 双总线（加 CPU–主存专道）→ 三总线（再加 I/O 总线）→ 多总线结构（高低速设备分级，靠<strong>总线桥</strong>完成协议转换、数据转换、透明传送）。</li>
          </ul>
        </div>

        <FormulaBox
          label="总线带宽与关键指标（P7–P11）"
          formula={`总线带宽 B = W × F / N     （W：数据总线字节宽度；F：总线时钟频率；N：一次传送所需时钟周期数）
主存寻址空间 = 2^(地址总线位数)   （如 ISA 20位 → 1M 单元；PCI 32位 → 4G 单元）`}
          note="总线复用（地址/数据分时共用以减少引脚）；猝发传输 Burst（一次送首址连续传输多个相邻单元，列数为突发长度 BL）。"
        />

        <BusArbitrationLab />
      </ConceptSection>

      <ConceptSection id="m6-disk" title="2. 外部设备、硬盘指标与 7 种数字磁记录编码" slideRef="W6 · P24–P43">
        <div className="prose">
          <p>
            磁头是电磁转换元件：写入为<strong>电→磁转换</strong>，读出为<strong>磁→电转换</strong>（磁化转变区经过磁头感应电势）。硬盘信息分四层：<strong>记录面（磁头号）→ 圆柱面（磁道号，最外圈为 0 号）→ 磁道 → 扇区（从 1 开始编号，常 512B）</strong>。定位机构分步进电机（开环精度低）与音圈电机（闭环反馈寻道快、精度高）。
          </p>
        </div>

        <FormulaBox
          label="磁介质存储器核心计算公式（P34–P37）"
          formula={`非格式化容量 = 最大位密度 × 最内圈磁道周长 × 总磁道数
格式化容量   = 每道扇区数 × 扇区容量 × 总磁道数    （约为非格式化容量的 60%~80%）
平均存取时间 Ta = 平均寻道时间 Ts + 平均旋转等待时间 Tw (+ 传输时间 + 控制器开销)
               = (Ts_max + Ts_min)/2 + (Tw_max + Tw_min)/2     （Tw 平均为旋转半圈耗时）`}
          note="记录密度：道密度（横向，TPI/TPM）× 位密度（纵向，bpi/bpm）= 面密度；数据传送率 Dr；误码率。"
        />

        <MagRecordingLab />
      </ConceptSection>

      <ConceptSection id="m6-io-int" title="3. I/O 接口、程序查询与程序中断系统" slideRef="W6 · P45–P67">
        <div className="prose">
          <p>
            <strong>I/O 接口五大作用</strong>：① 通信联络控制；② 地址译码和设备选择；③ 数据缓冲；④ 数据格式变换（并/串）；⑤ 传递控制命令和状态信息。
          </p>
          <p>
            <strong>方式一：程序查询方式</strong>——CPU 不断循环读状态口（Ready 标志），就绪后再读写数据口；控制极简但 CPU 长期“踏步等待”，主机与外设、各外设间均不能并行，也无法处理突发异常。
          </p>
        </div>

        <div className="compare-grid">
          <div className="compare-panel">
            <h4>程序中断 vs 调用子程序三大区别（P50）</h4>
            <ul>
              <li><strong>触发方式</strong>：子程序由程序员写 CALL 事先安排；中断由随机事件触发。</li>
              <li><strong>关联性</strong>：子程序受主程序控制；中断服务程序与被中断程序一般无关。</li>
              <li><strong>并发性</strong>：不会同时调用多子程序；可能多个外设同时请求中断（须判优）。</li>
            </ul>
          </div>
          <div className="compare-panel">
            <h4>CPU 响应中断 3 条件 &amp; 中断隐指令 3 任务（P57–P59）</h4>
            <ul>
              <li><strong>响应条件</strong>：① 收到中断请求；② CPU 开中断（允许中断触发器=1）；③ 当前指令执行完毕。</li>
              <li><strong>中断隐指令（纯硬件实现，无操作码）</strong>：① 保存断点（PC 存入堆栈或 0 号单元）；② 关中断（防保护现场被打断）；③ 引出中断服务程序（向量地址→PC）。</li>
            </ul>
          </div>
        </div>

        <DatasheetTable
          headers={['中断分类（5 组）', '核心区分']}
          rows={[
            ['自愿中断 vs 强迫中断', '软件中断指令主动触发 vs 随机硬件事件强迫中止'],
            ['程序中断 vs 简单中断', '执行中断服务程序 vs DMA 方式（不破坏现行程序状态）'],
            ['内中断 vs 外中断', 'CPU 内部软硬件异常（除零/溢出） vs CPU 外部外设请求'],
            ['向量中断 vs 非向量中断', '中断源直接给出向量地址（入口地址或向量表指针） vs CPU 轮询查询'],
            ['单重中断 vs 多重中断', '服务中不可被打断 vs 服务中允许更高级中断打断（中断嵌套）'],
          ]}
        />

        <ExamTip title="中断全过程五阶段 & 软升级核心（P63–P67）">
          <strong>五阶段</strong>：中断请求 → 中断判优（软件轮询 / 硬件排队）→ 中断响应（中断隐指令）→ 中断处理（保护现场 → [多重时开中断] → 执行服务 → 关中断 → 恢复现场 → 开中断）→ 中断返回。
          <br />
          <strong>中断屏蔽字（1=封锁屏蔽，0=开放允许）</strong>被称为“软排队器”：硬件<strong>响应次序</strong>固定不可改，但通过改写各级的屏蔽码，可以任意重排<strong>中断处理次序</strong>（中断软升级）！
        </ExamTip>

        <InterruptMaskLab />
      </ConceptSection>

      <ConceptSection id="m6-dma" title="4. DMA 直接存储器访问方式" slideRef="W6 · P68–P79">
        <div className="prose">
          <p>
            <strong>DMA 方式</strong>在外设与主存间开辟直接数据通道，无需 CPU 逐字干预与软件循环，实现高速成组数据传送。DMA 控制器核心 6 部件：<strong>主存地址计数器</strong>、<strong>传送长度计数器</strong>、<strong>数据缓冲寄存器</strong>、<strong>DMA 请求触发器</strong>、<strong>控制/状态逻辑</strong>、<strong>中断机构</strong>（长度计 0 时溢出触发中断做后处理）。
          </p>
        </div>

        <DatasheetTable
          headers={['对比维度', '程序中断方式', 'DMA 方式']}
          rows={[
            ['响应时机（断点）', '每条指令执行完毕时刻', '每个机器周期结束时刻'],
            ['现场保护', '程序切换，必须保存/恢复断点与现场', '传送期不占用 CPU 寄存器，无需保护现场'],
            ['优先级与适用场景', '优先级低于 DMA；适合低中速设备及异常处理', '优先级高于中断；适合磁盘/网卡等高速批量数据块'],
            ['传送循环实现者', 'CPU 执行软件循环指令', 'DMA 控制器硬件自动增减计数器完成'],
          ]}
        />

        <WorkedExample title="DMA 周期挪用遇访存冲突的三种情形（P77）">
          ① <strong>CPU 此时不访存</strong>（如正执行耗时长的乘法内部运算）：完全不冲突；
          ② <strong>CPU 正在访存</strong>：等本存取周期结束，CPU 让出总线；
          ③ <strong>CPU 与 DMA 同时请求访存</strong>：<strong>I/O 访存优先于 CPU 访存</strong>（防高速外设数据丢失），DMA 窃取 1~2 个存取周期，CPU 延缓后再访存。
        </WorkedExample>

        <DmaTransferLab />

        <QuizBlock questions={M6_QUIZ} />
      </ConceptSection>

      <ModuleFooterNav
        moduleId="m6"
        isDone={isDone}
        onToggleDone={onToggleDone}
        prev={{ id: 'm5', label: '模块五：中央处理器' }}
        next={{ id: 'formulas', label: '全局核心公式与考点速查表' }}
        onNavigate={onNavigate}
      />
    </div>
  );
}
