export const catalogDatasets = [
  { id: 'equipment', label: '武器与护甲', file: 'manifest-equipment-catalog', key: 'items', note: '按 Hash 保留同名版本。词条是定义候选，不是已拥有掉落；来源不是实时在售或掉落保证。' },
  { id: 'abilities', label: '职业技能', file: 'manifest-abilities', key: 'items', note: '普通与棱镜的具体技能 Hash 全部保留；职业百科按真实子职业池展示。' },
  { id: 'artifacts', label: '神器', file: 'manifest-artifact', key: 'items', note: '复刻神器按物品插槽生成；历史物品与旧赛季节点树单独留档，不能混用。' },
  { id: 'mods', label: '护甲 / 机灵增强模组', file: 'manifest-mods', key: 'items', note: '增强模组定义目录，含旧版和占位项；实际配置只接受对应装备插槽的候选。其他类型见全部插槽词条。' },
  { id: 'plugs', label: '全部插槽词条', file: 'manifest-plugs', key: 'items', note: '武器 Perk、武器模组、护甲、机灵、神器、调谐和外观等全部公开 plug 定义；保留官方分类标识。' },
  { id: 'ghosts', label: '机灵外壳', file: 'manifest-items', key: 'items', filter: i => i.itemType === 24, note: '全部公开机灵外壳；护甲商位于增强模组及构筑工具中。' },
  { id: 'sets', label: '护甲套装', file: 'manifest-item-sets', key: 'sets', note: '成员 Hash、效果和件数均来自官方定义；中文名使用官方翻译。' },
  { id: 'activities', label: '活动', file: 'manifest-activities', key: 'activities', note: '全部公开具名活动定义，包括历史记录；并非本周轮换列表。' },
  { id: 'perks', label: 'Sandbox 效果', file: 'manifest-perks', key: 'perks', note: '包含无名称效果，避免丢失条件描述；缺少文本时保留 Hash，不编造说明。' },
  { id: 'items', label: '全部物品', file: 'manifest-items', key: 'items', note: '全部公开具名物品，包括材料、外观、载具、历史及占位记录。' },
  { id: 'references', label: '基础分类', file: 'manifest-references', key: 'items', note: '职业、伤害类型、属性、活动类型、物品分类、装备槽和插槽定义；旧属性 Hash 留档，不作为当前六维建议。' },
  { id: 'vendors', label: '供应商候选', file: 'manifest-vendor-inventory', key: 'entries', note: '静态 itemList 候选，不是当前库存；保留每个售卖条目的索引。' },
  { id: 'rewards', label: '活动奖励', file: 'manifest-activity-rewards', key: 'entries', note: '活动显式奖励关系；不代表完整遭遇战掉落池、轮换或概率。' }
]
