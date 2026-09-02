const acquisitionPathDefinitions = [
  { id: 'exotic-engram', name: '异域记忆水晶与拉乎尔专注', access: 'free-or-expansion-dependent', deterministic: false, steps: ['获取异域记忆水晶', '在高塔拉乎尔处解码或专注目标装备'], alternatives: ['维持基础高属性传说护甲'] },
  { id: 'exotic-archive-red-war', name: '高塔异域档案：红色战争', access: 'free', deterministic: true, steps: ['前往高塔异域档案', '使用异域密码与上维碎片兑换极星长枪'] },
  { id: 'exotic-archive-final-shape', name: '高塔异域档案：《终焉之形》', access: 'the-final-shape', deterministic: true, steps: ['前往高塔异域档案', '使用异域密码与上维碎片兑换北极星（Lodestar）'] },
  { id: 'rahool-focusing-tfs', name: '拉乎尔新奇解密：《终焉之形》', access: 'the-final-shape', deterministic: true, steps: ['提升拉乎尔声望并重置', '打开新奇解密', '消耗异域记忆水晶与材料专注目标装备'] },
  { id: 'rahool-focusing-lightfall', name: '拉乎尔专注：《光陨之秋》', access: 'lightfall', deterministic: true, steps: ['拥有对应资料片', '在拉乎尔处使用高级专注获取目标异域'] },
  { id: 'rahool-focusing-witch-queen', name: '拉乎尔专注：《邪姬魅影》', access: 'witch-queen', deterministic: true, steps: ['拥有对应资料片', '在拉乎尔处使用高级专注获取目标异域'] },
  { id: 'pale-heart-engram', name: '苍白之心目的地武器', access: 'the-final-shape', deterministic: true, steps: ['推进《终焉之形》战役与目的地任务', '解锁对应武器', '获取深视版本并完成图样', '在飞地锻造目标词条'] },
  { id: 'episode-echoes', name: '回声章节武器', access: 'episode-echoes', deterministic: true, steps: ['解锁回声章节活动或当前替代来源', '获取深视版本', '完成图样后锻造'], note: '内容轮换后的实际入口需要按当前版本复核。' },
  { id: 'khvostov-quest', name: '苍白之心赫沃斯托任务链', access: 'the-final-shape', deterministic: true, steps: ['完成《终焉之形》战役', '收集区域宝箱与加密碎片', '击败所有苍白之心推翻首领并收集光之微粒', '在旧高塔区域取得异域赫沃斯托'] },
  { id: 'zero-hour', name: '零时任务', access: 'free', deterministic: true, steps: ['完成零时异域任务获得全面爆发', '完成任务目标解锁内在升级与可选词条', '在飞地重塑'] },
  { id: 'warlords-ruin', name: '战争领主的废墟地牢', access: 'lightfall-dungeon-key', deterministic: false, steps: ['组队或单人进入地牢', '刷取可掉落负债善意的遭遇战', '保留符合目标词条的掉落'] },
  { id: 'wild-card-quest', name: 'Wild Card 异域任务', access: 'the-final-shape', deterministic: true, steps: ['完成《终焉之形》主线', '完成 Wild Card 任务', '领取仍然狩猎'] },
  { id: 'last-wish', name: '最后遗愿突袭', access: 'forsaken-pack', deterministic: true, steps: ['完成每周突袭遭遇战与鹰头宝箱', '收集深视顶级掠食者', '完成五次图样进度后锻造'] },
  { id: 'onslaught', name: '猛攻活动', access: 'free', deterministic: false, steps: ['进入先锋中的猛攻活动', '专注或刷取边缘交通', '保留目标双词条组合'] },
  { id: 'world-drop', name: '世界掉落', access: 'free', deterministic: false, steps: ['参与任意活动获取世界战利品', '在可用时使用枪匠记忆水晶或专注', '保留目标词条组合'] }
  ,{ id: 'dual-destiny', name: '双重命运异域任务', access: 'the-final-shape', deterministic: false, steps: ['完成《终焉之形》战役并解锁苍白之心推翻活动', '在三个推翻区域完成隐藏机制，解锁双重命运任务', '两人完成双重命运获得职业对应异域职业物品', '重复任务或使用当前版本开放的替代来源刷取双特性组合'], note: '具体掉落来源和每周规则可能随补丁调整。' }
  ,{ id: 'set-truth-of-rights', name: '权利真相套装来源', access: 'renegades', deterministic: false, steps: ['进入叛逃者相关活动', '从对应掉落池收集头盔、臂铠、胸甲、腿甲和职业装备', '保留高属性部位并凑齐目标套装件数'] }
  ,{ id: 'set-aion-adapter', name: 'AION 适配者套装来源', access: 'edge-of-fate', deterministic: false, steps: ['完成宿命边缘相关活动', '从活动奖励池获取套装部位', '优先保留韧性与恢复高于目标线的部位'] }
  ,{ id: 'set-aion-renewal', name: 'AION 复兴套装来源', access: 'edge-of-fate', deterministic: false, steps: ['完成宿命边缘相关活动', '从活动奖励池获取套装部位', '优先保留纪律与智慧高于目标线的部位'] }
  ,{ id: 'set-first-ascent', name: '初次远征套装来源', access: 'the-final-shape', deterministic: true, steps: ['推进终焉之形战役和苍白之心活动', '收集五个护甲部位', '大师化后用属性模组补齐构筑目标'] }
  ,{ id: 'set-bushido', name: '武士道套装来源', access: 'reclamation', deterministic: false, steps: ['参与收复季活动', '从活动掉落池收集套装部位', '以机动性和力量为筛选优先级'] }
  ,{ id: 'set-praxic', name: '普拉希克套装来源', access: 'renegades', deterministic: false, steps: ['完成叛逃者相关活动', '从活动掉落池收集套装部位', '以恢复和智慧为筛选优先级'] }
  ,{ id: 'set-dungeon-equilibrium', name: '均衡地牢套装来源', access: 'equilibrium', deterministic: false, steps: ['进入均衡地牢', '按遭遇战掉落部位刷取', '保留高总值部位并组合异域护甲'] }
  ,{ id: 'set-raid-desert-perpetual', name: '永恒荒漠突袭套装来源', access: 'desert-perpetual', deterministic: false, steps: ['完成永恒荒漠突袭遭遇战', '按掉落部位补齐五件套', '在首领输出或机制位前确认套装加成与属性目标'] }
]

export const acquisitionPaths = acquisitionPathDefinitions.map(path => ({
  ...path,
  sourceIds: path.sourceIds || ['editorial-baseline'],
  verifiedAt: path.verifiedAt || '2026-08-31',
  confidence: path.confidence || (path.deterministic ? 'C' : 'D')
}))

export const acquisitionById = Object.fromEntries(acquisitionPaths.map(item => [item.id, item]))
