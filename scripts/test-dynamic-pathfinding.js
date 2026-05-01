const { DynamicWeightedAStarOptimized } = require('../frontend/miniprogram/utils/pathfinding/index.js');

function buildGrid(width, height, walls = []) {
  const grid = Array.from({ length: height }, () => Array(width).fill(0));

  for (const wall of walls) {
    for (let y = wall.y; y < wall.y + wall.h; y++) {
      for (let x = wall.x; x < wall.x + wall.w; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          grid[y][x] = 1;
        }
      }
    }
  }

  return grid;
}

const algorithmConfigs = {
  '标准A*': {
    weightStrategy: 'fixed',
    heuristic: 'manhattan',
    maxWeight: 1.0,
    minWeight: 1.0,
    pathSmoothing: false,
    useEnhancedCostModel: false
  },
  '动态加权A*': {
    weightStrategy: 'exponential',
    heuristic: 'manhattan',
    maxWeight: 2.5,
    minWeight: 1.0,
    pathSmoothing: true,
    useEnhancedCostModel: true
  }
};

const scenarios = [
  {
    id: 'S1',
    name: '常规通行',
    description: '两段纵向障碍，验证基础通行与路径平滑效果',
    grid: buildGrid(20, 20, [
      { x: 8, y: 2, w: 1, h: 12 },
      { x: 12, y: 6, w: 1, h: 12 }
    ]),
    start: { x: 1, y: 1 },
    end: { x: 18, y: 18 }
  },
  {
    id: 'S2',
    name: '狭窄绕行',
    description: '围合式障碍，验证狭窄通道中的绕行能力',
    grid: buildGrid(24, 24, [
      { x: 4, y: 4, w: 16, h: 1 },
      { x: 4, y: 4, w: 1, h: 16 },
      { x: 19, y: 4, w: 1, h: 16 },
      { x: 4, y: 19, w: 10, h: 1 }
    ]),
    start: { x: 2, y: 2 },
    end: { x: 21, y: 21 }
  },
  {
    id: 'S3',
    name: '多转弯场景',
    description: '锯齿式纵向障碍，验证复杂场景下的转弯优化能力',
    grid: buildGrid(30, 18, [
      { x: 5, y: 0, w: 1, h: 12 },
      { x: 10, y: 6, w: 1, h: 12 },
      { x: 15, y: 0, w: 1, h: 12 },
      { x: 20, y: 6, w: 1, h: 12 },
      { x: 25, y: 0, w: 1, h: 12 }
    ]),
    start: { x: 1, y: 16 },
    end: { x: 28, y: 1 }
  }
];

function runAlgorithm(grid, start, end, algorithmName) {
  const algorithm = new DynamicWeightedAStarOptimized(algorithmConfigs[algorithmName]);
  const path = algorithm.findPath(grid, start, end);
  const stats = algorithm.getStats();

  return {
    path,
    originalLength: stats.originalLength,
    turnCount: stats.turnCount,
    nodesExpanded: stats.nodesExpanded,
    computeTime: Number(stats.computeTime.toFixed(3))
  };
}

function padRight(value, width) {
  return String(value).padEnd(width, ' ');
}

function printScenarioSummary(scenario, baseline, dynamic) {
  console.log(`\n${scenario.id} ${scenario.name}`);
  console.log(`- 场景说明: ${scenario.description}`);
  console.log(`- 起点: (${scenario.start.x}, ${scenario.start.y})`);
  console.log(`- 终点: (${scenario.end.x}, ${scenario.end.y})`);
  console.log(`- 标准A* 路径点数: ${baseline.path.length}`);
  console.log(`- 动态加权A* 路径点数: ${dynamic.path.length}`);
}

function printMarkdownTable(results) {
  console.log('\n结果表（Markdown）');
  console.log('| 场景 | 指标 | 标准A* | 动态加权A* |');
  console.log('| --- | --- | --- | --- |');

  for (const row of results) {
    console.log(`| ${row.scenario} | 原始路径长度 | ${row.standard.originalLength} | ${row.dynamic.originalLength} |`);
    console.log(`| ${row.scenario} | 转弯次数 | ${row.standard.turnCount} | ${row.dynamic.turnCount} |`);
    console.log(`| ${row.scenario} | 节点扩展数 | ${row.standard.nodesExpanded} | ${row.dynamic.nodesExpanded} |`);
    console.log(`| ${row.scenario} | 计算时间(ms) | ${row.standard.computeTime.toFixed(3)} | ${row.dynamic.computeTime.toFixed(3)} |`);
  }
}

function printConsoleTable(results) {
  console.log('\n控制台结果表');
  const columns = [
    { key: 'scenario', title: '场景', width: 18 },
    { key: 'metric', title: '指标', width: 16 },
    { key: 'standard', title: '标准A*', width: 12 },
    { key: 'dynamic', title: '动态加权A*', width: 14 }
  ];

  console.log(
    `${padRight(columns[0].title, columns[0].width)}${padRight(columns[1].title, columns[1].width)}${padRight(columns[2].title, columns[2].width)}${padRight(columns[3].title, columns[3].width)}`
  );
  console.log('-'.repeat(60));

  for (const row of results) {
    const lines = [
      ['原始路径长度', row.standard.originalLength, row.dynamic.originalLength],
      ['转弯次数', row.standard.turnCount, row.dynamic.turnCount],
      ['节点扩展数', row.standard.nodesExpanded, row.dynamic.nodesExpanded],
      ['计算时间(ms)', row.standard.computeTime.toFixed(3), row.dynamic.computeTime.toFixed(3)]
    ];

    lines.forEach((line, index) => {
      console.log(
        `${padRight(index === 0 ? row.scenario : '', columns[0].width)}${padRight(line[0], columns[1].width)}${padRight(line[1], columns[2].width)}${padRight(line[2], columns[3].width)}`
      );
    });
  }
}

function main() {
  console.log('========================================');
  console.log('  动态加权A* 对比测试');
  console.log('========================================');

  const results = [];

  for (const scenario of scenarios) {
    const baseline = runAlgorithm(scenario.grid, scenario.start, scenario.end, '标准A*');
    const dynamic = runAlgorithm(scenario.grid, scenario.start, scenario.end, '动态加权A*');

    printScenarioSummary(scenario, baseline, dynamic);

    results.push({
      scenario: `${scenario.id} ${scenario.name}`,
      standard: baseline,
      dynamic
    });
  }

  printConsoleTable(results);
  printMarkdownTable(results);

  console.log('\n说明: 计算时间会随机器负载略有波动，但原始路径长度、转弯次数和节点扩展数应基本稳定。');
}

main();
