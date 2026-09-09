# 同名装备与使用条件审计 / 修复记录

审计日期：2026-09-09。依据本地 Bungie Manifest `244213.26.06.29.2000-1-bnet.65864`，物品快照同步于 `2026-09-08T04:56:13.952Z`。

结论：同名不同 Hash 大多是官方独立定义。本站现已把主要功能差异和使用条件投影到共享元数据，并在列表、详情、版本选择和配装校验中使用；本记录保留修复前的审计证据和修复后的回归结果。

## 范围与证据

检查了原始 InventoryItem / PlugSet、标准化目录、武器与防具分组、列表和详情模板，以及实际配装校验函数。没有访问实时账号或验证当前赛季可用性，也没有进行浏览器实机操作。

统计依据实际页面使用的分组函数；下列范围互有重叠，不能相加作为问题总数。

| 范围 | 数量 | 说明 |
| --- | ---: | --- |
| 装备定义 | 8,237 | 2,208 个武器、6,029 个防具 |
| 多版本武器组 | 580 | 其中 505 组词条池不同、498 组发行标识不同 |
| 普通 / Holofoil 标识不同的武器组 | 85 | 原始 `isHolofoil` 不同，装备目录没有保留该字段 |
| 有无锻造配方不同的武器组 | 48 | 原始 `inventory.recipeItemHash` 有无不同 |
| 多版本防具组 | 1,506 | 同名、职业、部位、稀有度与套装归属相同，页面合并展示 |
| 模组候选不同的防具组 | 1,036 | 对比现有 `armorSockets()` 得到的各槽候选，不以总插槽数推导 |
| 增强模组目录 | 513 | 334 个原始定义带非空安装或生效规则，标准化模组对象没有这些字段 |
| 同名 1 / 3 能量模组组 | 75 | 75 个 1 能量版本均带神器条件；能量抄录错误为 0 |
| 带词条锻造等级或解锁要求的武器 | 172 | 按实际关联到武器 Perk 插槽的 PlugSet 条目统计 |

机器证据见 [item-variant-evidence.json](item-variant-evidence.json)。可重复执行只读审计：

```sh
node scripts/audit-item-variants.js
```

脚本读取快照并调用现有分组与校验函数，输出 JSON，不修改目录数据。它是问题调查工具，退出成功仅表示扫描完成，不表示所列问题已修复。

## 1. 神器减费条件缺失，并且校验接受未配置神器的模组〔P1〕

原始模组 `644105`「重型弹药搜寻者」为 1 能量，规则包含 `Must Be Selected in the Seasonal Artifact`。普通版 `554409585` 为 3 能量。

修复前复现：选择「战神头冠」`26254737` 的 socketIndex `1`，安装 `644105`，草稿 `artifactHash = null`，调用 `validateLoadout()` 返回空错误列表。修复后同一输入返回“需先配置对应神器与解锁项”；该模组仍会出现在 908 个护甲定义的官方候选中，但不再被当作已满足条件。

数据丢失处：[normalize-manifest-components.js](../../scripts/normalize-manifest-components.js)，`mods` 投影没有携带 `insertionRules` / `enabledRules`。校验缺口：[loadout-planner/index.js](../../packages/loadout-planner/index.js) 的 `modErrors()` 只检查候选归属、重复插槽和能量；[validation.js](../../packages/loadout-planner/validation.js) 分别检查模组与神器，没有关联两者。

已实施：保留、展示神器前置条件；在未证明满足条件时显示明确的配置问题或待核对状态。不能仅因出现在插槽候选中就认定可用，也不能把所有低能量模组一律判成神器版。

## 2. 防具合并掩盖了插槽体系差异〔P2〕

「炎阳护腕」三个同名定义被分在同一组：

| Hash | 官方插槽差异 |
| --- | --- |
| `1862800747` | 旧式属性 / 特性与 `enhancements.universal` 插槽；现有配装工具不解析出可选的现代能量模组槽 |
| `950745251` | 四个现代能量模组槽，并有 `core.gear_systems.armor_tiering.plugs.tuning.mods` 调谐槽 |
| `3787517196` | 四个现代能量模组槽，并有 `enhancements.artifice` 和 `enhancements.artifice.exotic`；后者默认是 Locked Artifice Socket |

「雄鹿」也有相同类型的三版本差异。这里的插槽定义不代表账号已解锁巧匠槽。

[armor.js](../../packages/manifest-catalog/armor.js) 的防具投影只保留套装、固有特性和来源等信息，没有输出模组槽功能摘要；`armorGroups()` 也不按槽位能力区分。[ArmorView.vue](../../web/src/views/ArmorView.vue) 的下拉选项仅为“版本 N Hash …”，无法据此判断旧式、调谐或巧匠相关版本。构筑选择器又直接平铺各 Hash，形成多张近似相同的卡片。

已实施：在卡片和版本选项中展示有证据支持的插槽体系、调谐 / 巧匠 / 活动槽特征与锁定条件。同名分组仍可保留，但组内版本应有功能摘要；不能用总插槽数量代替模组槽数量。

## 3. 武器复刻、发行与 Holofoil 差异只剩编号或图片〔P2〕

「长臂」`8293111` 的原始 `isHolofoil=false`，发行标识为 `releases.v630.season`；同名 `14929251` 为 `isHolofoil=true`，发行标识为 `releases.v820.season`。两个版本还有不同的强化相关插槽。

[normalize-manifest-components.js](../../scripts/normalize-manifest-components.js) 未保留 `isHolofoil` 和 `traitIds` 的发行信息。武器页保留发行水印，并允许查看各 Hash 的数值和 Perk 池，但没有把版本差异写成文本摘要。版本号实际按“有收藏记录优先，然后 Hash 数值”排序，**不是发行先后，也不能据此默认选最新版**。

已实施：保留官方特殊版本标识，关联可验证的发行资料，展示词条池 / 起源特性差异。没有可靠时间映射时保留未知，不从 Hash 大小或水印文件名猜赛季。

## 4. 同名武器的锻造能力没有区分〔P2〕

「命运终结者」`2171478765` 没有 `inventory.recipeItemHash`，发行标识为 `releases.v520.season`；`4184168210` 有配方 `1718491554`，发行标识为 `releases.v820.season`，还有深视、武器等级提升等插槽及起源特性列。

装备标准化没有保留配方关联，页面只能显示不同的插槽 / Perk 数量，不能直接回答“哪个版本有锻造配方”。85 组 Holofoil 差异与 48 组配方有无差异是不同维度，不能互相替代。

已实施：提供“有锻造配方”“有强化插槽”等能力标签，并与“账号已解锁图样”“当前实物已强化”分开。官方 tooltip 同时可能包含多个状态的提示，不能把所有提示都当作已满足的状态。

## 5. Perk 的锻造等级条件在候选池转换中丢失〔P2〕

「命运终结者」`4184168210` 的 socketIndex `3`，PlugSet `1359881065` 内的 Keep Away / 切勿靠近 `3619207468` 带：

```json
{
  "craftingRequirements": {
    "requiredLevel": 4,
    "unlockRequirements": [{ "failureDescription": "Requires Weapon Level 4" }],
    "materialRequirementHashes": [4034325565]
  }
}
```

[normalize-manifest-components.js](../../scripts/normalize-manifest-components.js) 的 `plugSetEntries` 只保留 `plugItemHashes` 等字段，删除了逐候选的 `craftingRequirements`。[weapon-perks.js](../../packages/loadout-planner/weapon-perks.js) 也没有取得这些条件的渠道。

已实施：保留“武器 → 插槽 → 候选”关系上的锻造等级与材料条件，在详情说明适用的获取方式。**这是锻造前置条件，不应误写成随机掉落也需要武器等级 4**，也不应阻止用户规划尚未解锁的目标构筑。

## 6. 完整词条目录已保存的限制，页面仍未显示〔P2〕

完整 `manifest-plugs` 中有 5,831 个定义带规则，包含外观、技能、机灵等，不能全部计作战斗模组问题。与装备选择直接相关的例子：

| 规则 | 定义数 | 例子 |
| --- | ---: | --- |
| Requires Shaped or Enhanced Weapon | 26 | 「近战光学瞄准镜：高」`52638289` |
| Requires Adept Weapon | 16 | 「专家射程」`299264772` |
| This mod only works in specific activities. | 12 | 「跳跃射击」`1285109625` |
| Expired. Destination Mod cannot be equipped. | 15 | 「旅行者的神盾」`79833168` |

[manifest-catalog/index.js](../../packages/manifest-catalog/index.js) 已保存这些规则，但 [ManifestDataCatalog.vue](../../web/src/components/ManifestDataCatalog.vue) 和 [EncyclopediaEntryView.vue](../../web/src/views/EncyclopediaEntryView.vue) 没有渲染它们。后者的“效果与说明”并不能补回安装与生效要求。

**失败提示是条件定义，不是当前状态。** 例如出现“Expired”失败文案不能证明某个账号的该效果现在已过期；正确呈现是“有过期限制，当前状态未知”，除非另有明确废弃描述或实时证据。同理不能仅凭“Content Temporarily Disabled”失败文案把整个条目标记为当前禁用。

已实施：为武器、模组、词条详情统一增加“安装条件 / 生效范围 / 解锁要求”，卡片显示最影响选择的条件标签，未知状态明确保留。

## 7. 普通 / 强化武器模组在入口间展示不一致〔P2〕

有 29 组同名定义同时包含 `Weapon Mod` 与 `Enhanced Weapon Mod`。例如「快速切换枪带」`1334978104` / `139132552`，「丰足弹药」`1197814525` / `325500297`。

完整词条目录保留且列表显示英文 `typeName`；武器 Perk 编辑器也已经有强化标签。这部分并非完全丢失。但百科详情没有明确展示类型，名称链接仍可能同名，不能保证用户从不同入口都看出版本区别。

已实施：复用已有强化识别规则，在适用的列表、链接、详情标题中保持一致，并同时展示条件。不能将“强化模组类型”和“武器自身可强化”混为一谈。

## 8. 现有完整性审计不能发现以上语义丢失

[audit-manifest-catalog.js](../../scripts/audit-manifest-catalog.js) 检查 Hash、数量、关联、池内候选与发布副本，但没有针对上述版本标识、逐候选锻造条件和规则展示建立检查。因此“覆盖完整”不等于“版本差异与条件完整”。

修正后应增加针对真实案例的回归检查：无神器时如何提示减费模组、三种炎阳护腕的功能摘要、有无配方的命运终结者、切勿靠近的锻造等级、受限武器模组的详情说明。数值、标签与可用性检查需要分别验证。

## 已确认存在的保护与边界

- 普通 / 专家等不同名称的武器没有被并成一个版本池；武器 Perk 编辑器已区分普通与强化词条，并按具体 Hash 和插槽解析。
- 防具套装按精确 Hash 归属，`armorGroups()` 将套装归属纳入分组，没有因为同名就给旧装备补套装效果。
- 历史神器、旧节点树与复刻神器已有类型与可选状态区分；跨快照版本也已有检查。
- 异域职业装备的棱镜专属条件已在 `validateLoadout()` 检查，不属于本次遗漏。
- 原始 PlugSet 还含 `currentlyCanRoll`，标准化未保存；本次检查未在武器随机 Perk 池中复现 `currentlyCanRoll=false` 的候选被显示，因此没有把它列为已发生的错误掉落池问题。

建议修正顺序：先处理神器条件与配装提示，再补齐共享的版本 / 条件数据，随后统一卡片、版本选择和详情展示，最后将关键案例加入常规审计。单纯按名字去重或保留最小能量版本都会损失正确的官方定义。

本次已修改目录生成逻辑、共享版本元数据、前端展示、配装条件校验和导出模型，并保留只读审计脚本与证据文件。

验证：审计脚本运行成功；报告相对链接与关键复现 JSON 已核对。现有目录、武器版本、武器词条、配装规划与新增版本条件测试共 146 项全部通过；新增回归覆盖了本次神器条件、锻造条件和版本特征复现。
