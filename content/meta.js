export const MANIFEST_VERSION = '244213.26.06.29.2000-1-bnet.65583'
export const DATA_VERSION = `tfs-prismatic-baseline@manifest-${MANIFEST_VERSION}`
export const RULES_VERSION = '2.1.0'

export const verificationLevels = {
  A: { label: '官方数据', description: '来自 Bungie 官方页面、补丁或清单。' },
  B: { label: '可复现测试', description: '可在游戏内按记录步骤复现。' },
  C: { label: '社区共识', description: '来自稳定社区资料，仍建议按当前版本复核。' },
  D: { label: '编辑建议', description: '策略性或主观建议，不作为官方数值。' }
}

export const sources = [
  {
    id: 'bungie-final-shape',
    level: 'A',
    title: 'Destiny 2: The Final Shape — Prismatic',
    publisher: 'Bungie',
    url: 'https://www.bungie.net/7/en/Destiny/TheFinalShape',
    checkedAt: '2026-08-31',
    note: '棱镜、超越与异域职业物品的官方产品说明入口。'
  },
  {
    id: 'bungie-manifest',
    level: 'A',
    title: 'Destiny 2 Manifest',
    publisher: 'Bungie API',
    url: 'https://www.bungie.net/Platform/Destiny2/Manifest/',
    checkedAt: '2026-08-31',
    note: '实体名称、哈希、装备类别与基础定义的权威机器数据；本地同步需网络。'
  },
  {
    id: 'bungie-buildcrafting',
    level: 'A',
    title: 'Buildcrafting updates',
    publisher: 'Bungie',
    url: 'https://www.bungie.net/7/en/News',
    checkedAt: '2026-08-31',
    note: '技能、模组和装备平衡变更应逐条绑定具体补丁公告。'
  },
  {
    id: 'editorial-baseline',
    level: 'D',
    title: '本站构筑编辑基线',
    publisher: 'Destiny 2 Knowledge Hub',
    url: null,
    checkedAt: '2026-08-31',
    note: '用于表达玩法目标、操作难度与刷取优先级；不替代官方数值。'
  },
  {
    id: 'community-baseline',
    level: 'C',
    title: '社区子职业术语基线',
    publisher: 'Destiny 2 社区资料',
    url: 'https://www.light.gg/',
    checkedAt: '2026-08-31',
    note: '用于普通子职业的英文实体名称与稳定机制术语；具体数值仍需按当前补丁复核。'
  },
  {
    id: 'editorial-catalog',
    level: 'D',
    title: '本站编辑目录',
    publisher: 'Destiny 2 Knowledge Hub',
    url: null,
    checkedAt: '2026-08-31',
    note: '仅用于尚未完成 Manifest 精确映射的目录标签，不参与严格推荐或官方事实展示。'
  }
]

export const dataPolicy = {
  snapshot: DATA_VERSION,
  rulesVersion: RULES_VERSION,
  officialFactsRequire: ['sourceIds', 'verifiedAt'],
  recommendationFactsRequire: ['activityIds', 'mechanicIds', 'limitations'],
  disclaimer: '构筑规则以《终焉之形》棱镜体系为可核验基线；后续补丁可能改变数值和可用性。'
}
