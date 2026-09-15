// Curated lore guide. Narrative records are editorial summaries, not Manifest definitions.

export const loreSources = [
  { id: 'destiny-campaign', name: '《命运》战役与典籍', nameEn: 'Destiny campaign and Grimoire', typeZh: '游戏内叙事', typeEn: 'In-game narrative', checkedAt: '2026-09-14' },
  { id: 'taken-king', name: '《被夺之王》', nameEn: 'The Taken King', typeZh: '资料片战役', typeEn: 'Expansion campaign', checkedAt: '2026-09-14' },
  { id: 'red-war', name: '《红战争》', nameEn: 'The Red War', typeZh: '游戏战役', typeEn: 'Campaign', checkedAt: '2026-09-14' },
  { id: 'forsaken', name: '《遗落之族》', nameEn: 'Forsaken', typeZh: '资料片战役', typeEn: 'Expansion campaign', checkedAt: '2026-09-14' },
  { id: 'arrivals', name: '《抵达季》', nameEn: 'Season of Arrivals', typeZh: '赛季叙事', typeEn: 'Seasonal narrative', checkedAt: '2026-09-14' },
  { id: 'witch-queen', name: '《邪姬魅影》', nameEn: 'The Witch Queen', typeZh: '资料片战役', typeEn: 'Expansion campaign', checkedAt: '2026-09-14' },
  { id: 'lightfall', name: '《光陨之秋》', nameEn: 'Lightfall', typeZh: '资料片战役', typeEn: 'Expansion campaign', checkedAt: '2026-09-14' },
  { id: 'final-shape', name: '《终焉之形》', nameEn: 'The Final Shape', typeZh: '资料片战役', typeEn: 'Expansion campaign', checkedAt: '2026-09-14' },
  { id: 'bungie-release-history', name: 'Bungie 官方发行资料', nameEn: 'Official Bungie release material', typeZh: '发行资料', typeEn: 'Release material', checkedAt: '2026-09-14' }
]

export const loreEras = [
  { id: 'foundations', name: '起源与崩塌', nameEn: 'Origins and Collapse' },
  { id: 'city-age', name: '城市时代', nameEn: 'City Age' },
  { id: 'guardian-era', name: '守护者纪元', nameEn: 'Guardian Era' },
  { id: 'light-dark', name: '光与暗终局', nameEn: 'Light and Darkness finale' },
  { id: 'fate', name: '命运传奇', nameEn: 'Fate Saga' },
  { id: 'all-eras', name: '贯穿多个时代', nameEn: 'Across eras' }
]

export const loreConcepts = [
  {
    id: 'traveler', name: '旅者', nameEn: 'The Traveler', category: 'cosmic', categoryZh: '宇宙存在', categoryEn: 'Cosmic entity', eraId: 'all-eras', spoilerLevel: 0,
    summary: '一个与光紧密相连的神秘存在。它推动了人类黄金时代，也在崩塌后留在最后之城上空。它的动机长期保持神秘，不能简单理解为会替人类作出所有选择的神明。',
    summaryEn: 'A mysterious entity closely associated with the Light. It enabled humanity’s Golden Age and remained above the Last City after the Collapse, while its motives resisted simple answers.',
    relatedIds: ['light', 'ghosts', 'golden-age', 'collapse', 'last-city'], sourceIds: ['destiny-campaign', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'light', name: '光', nameEn: 'Light', category: 'paracausal', categoryZh: '超因果力量', categoryEn: 'Paracausal power', eraId: 'all-eras', spoilerLevel: 0,
    summary: '一种超因果力量，常与物质世界、生命和创造联系在一起。守护者通过幽灵复活并运用光能，但使用光并不自动等同于道德上的善。',
    summaryEn: 'A paracausal power associated with the physical world, life, and creation. Guardians wield it through their bond with Ghosts, but using the Light does not automatically make someone morally good.',
    relatedIds: ['traveler', 'darkness', 'ghosts', 'guardians', 'lucent-brood'], sourceIds: ['destiny-campaign', 'witch-queen', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'darkness', name: '暗', nameEn: 'Darkness', category: 'paracausal', categoryZh: '超因果力量', categoryEn: 'Paracausal power', eraId: 'all-eras', spoilerLevel: 0,
    summary: '一种与意识、记忆和心智相关的超因果力量。见证者长期借暗推行自己的目标，但见证者并不等同于暗本身，守护者也能够驾驭冰凝与缚丝。',
    summaryEn: 'A paracausal power associated with consciousness, memory, and the mind. The Witness used it for its own purpose, but was not the Darkness itself; Guardians can also wield Stasis and Strand.',
    relatedIds: ['light', 'witness', 'pyramid-return', 'witness-arrives'], sourceIds: ['arrivals', 'witch-queen', 'lightfall', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'ghosts', name: '幽灵', nameEn: 'Ghosts', category: 'guardian', categoryZh: '守护者体系', categoryEn: 'Guardian system', eraId: 'city-age', spoilerLevel: 0,
    summary: '由旅者在崩塌后创造的智慧伙伴。幽灵会寻找能够承载光的人，将其复活为承光者，并负责治疗、复活、扫描与通讯。',
    summaryEn: 'Sapient companions created by the Traveler after the Collapse. A Ghost searches for a person capable of bearing the Light, resurrects them as a Lightbearer, and provides healing, resurrection, scanning, and communication.',
    relatedIds: ['traveler', 'light', 'guardians', 'risen-age'], sourceIds: ['destiny-campaign', 'witch-queen'], verifiedAt: '2026-09-14'
  },
  {
    id: 'guardians', name: '守护者', nameEn: 'Guardians', category: 'guardian', categoryZh: '守护者体系', categoryEn: 'Guardian system', eraId: 'guardian-era', spoilerLevel: 0,
    summary: '选择保卫最后之城的承光者。并非所有被幽灵复活的人都天然属于先锋；“守护者”代表后来形成的责任、共同体与身份。',
    summaryEn: 'Lightbearers who choose to defend the Last City. Not everyone resurrected by a Ghost automatically belongs to the Vanguard; “Guardian” is a later responsibility, community, and identity.',
    relatedIds: ['ghosts', 'vanguard', 'last-city', 'player-guardian'], sourceIds: ['destiny-campaign', 'red-war'], verifiedAt: '2026-09-14'
  },
  {
    id: 'final-shape-concept', name: '终焉之形', nameEn: 'The Final Shape', category: 'philosophy', categoryZh: '哲学与目标', categoryEn: 'Philosophy and purpose', eraId: 'light-dark', spoilerLevel: 1,
    summary: '见证者试图强加给宇宙的永恒静止状态：消除变化、痛苦与可能性，把万物固定成它认定的完美形态。它不是暗本身必然追求的结局。',
    summaryEn: 'The eternal, motionless state the Witness sought to impose on reality: ending change, pain, and possibility by fixing everything into its idea of perfection. It was not an inevitable goal of the Darkness itself.',
    relatedIds: ['witness', 'traveler', 'witness-arrives', 'witness-defeated'], sourceIds: ['lightfall', 'final-shape'], verifiedAt: '2026-09-14'
  }
]

export const loreEvents = [
  {
    id: 'golden-age', order: 10, name: '黄金时代', nameEn: 'The Golden Age', eraId: 'foundations', spoilerLevel: 0,
    summary: '旅者抵达太阳系后，人类科技、寿命与星际文明迅速发展。黄金时代建立了后来所有冲突的舞台。', summaryEn: 'After the Traveler arrived, human technology, lifespans, and interplanetary civilization advanced rapidly, establishing the world later conflicts would inherit.',
    cause: '旅者抵达太阳系并改造多个世界。', causeEn: 'The Traveler arrived in the solar system and transformed multiple worlds.',
    consequence: '人类向太阳系扩张，也留下战争思维、深石地窖等改变后世的遗产。', consequenceEn: 'Humanity expanded across the system and left legacies such as the Warminds and Deep Stone Crypt.',
    destination: '太阳系', destinationEn: 'Solar system', relatedIds: ['traveler', 'collapse', 'rasputin'], sourceIds: ['destiny-campaign'], verifiedAt: '2026-09-14'
  },
  {
    id: 'collapse', order: 20, name: '崩塌', nameEn: 'The Collapse', eraId: 'foundations', spoilerLevel: 0,
    summary: '黄金时代在一场席卷太阳系的灾难中终结。人类文明几乎灭亡，旅者最终停留在地球。', summaryEn: 'A system-wide catastrophe ended the Golden Age. Human civilization nearly vanished, and the Traveler came to rest above Earth.',
    cause: '见证者领导的黑舰队追踪旅者来到太阳系。', causeEn: 'The Black Fleet led by the Witness followed the Traveler into the solar system.',
    consequence: '幸存者聚集到旅者之下，幽灵开始寻找承光者。', consequenceEn: 'Survivors gathered beneath the Traveler, while Ghosts began searching for Lightbearers.',
    destination: '地球与太阳系殖民地', destinationEn: 'Earth and the system colonies', relatedIds: ['traveler', 'darkness', 'ghosts', 'risen-age', 'witness'], sourceIds: ['destiny-campaign', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'risen-age', order: 30, name: '承光者与城市时代', nameEn: 'The Risen and the City Age', eraId: 'city-age', spoilerLevel: 0,
    summary: '最早的承光者既有保护者，也有军阀。钢铁领主与后来建立的先锋逐步把力量、责任和最后之城联系起来。', summaryEn: 'The first Risen included protectors and warlords. The Iron Lords and later the Vanguard gradually tied power to responsibility and the defense of the Last City.',
    cause: '幽灵在崩塌后的废墟中复活了承光者。', causeEn: 'Ghosts resurrected Lightbearers throughout the ruins left by the Collapse.',
    consequence: '最后之城与守护者制度形成，成为人类文明的新核心。', consequenceEn: 'The Last City and the Guardian order formed as the new center of human civilization.',
    destination: '地球', destinationEn: 'Earth', relatedIds: ['ghosts', 'guardians', 'last-city', 'vanguard'], sourceIds: ['destiny-campaign'], verifiedAt: '2026-09-14'
  },
  {
    id: 'black-garden', order: 40, name: '黑色花园之战', nameEn: 'The Black Garden', eraId: 'guardian-era', spoilerLevel: 0,
    summary: '玩家守护者追踪威胁进入黑色花园，摧毁束缚旅者恢复的黑暗核心，由此成为先锋最关键的行动者之一。', summaryEn: 'The player Guardian followed a threat into the Black Garden and destroyed the dark heart obstructing the Traveler’s recovery, becoming one of the Vanguard’s most consequential agents.',
    cause: '陌客警告黑色花园中的力量正在压制旅者。', causeEn: 'The Exo Stranger warned that a power in the Black Garden was suppressing the Traveler.',
    consequence: '旅者开始恢复，玩家守护者进入更广阔的太阳系战争。', consequenceEn: 'The Traveler began to recover, and the player Guardian entered the wider wars of the solar system.',
    destination: '黑色花园', destinationEn: 'Black Garden', relatedIds: ['player-guardian', 'traveler', 'vex-collective'], sourceIds: ['destiny-campaign'], verifiedAt: '2026-09-14'
  },
  {
    id: 'taken-war', order: 50, name: '被夺战争', nameEn: 'The Taken War', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '欧里克斯为子复仇，率无畏战舰进入太阳系。守护者进入他的王座世界，终结了被夺之王。', summaryEn: 'Oryx entered the solar system aboard the Dreadnaught to avenge his son. Guardians entered his throne world and ended the Taken King.',
    cause: '守护者击败克罗塔，引来其父欧里克斯。', causeEn: 'The defeat of Crota drew his father Oryx to the solar system.',
    consequence: '被夺者失去原本的主人，邪魔族权力格局改变。', consequenceEn: 'The Taken lost their original master, changing the Hive balance of power.',
    destination: '土星与无畏战舰', destinationEn: 'Saturn and the Dreadnaught', relatedIds: ['oryx', 'hive-pantheon', 'player-guardian'], sourceIds: ['taken-king'], verifiedAt: '2026-09-14'
  },
  {
    id: 'red-war-event', order: 60, name: '红战争', nameEn: 'The Red War', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '盖欧率红军团占领最后之城并隔绝守护者与光。玩家重新取得力量、联合先锋并夺回城市。', summaryEn: 'Ghaul and the Red Legion occupied the Last City and severed Guardians from the Light. The player reclaimed that power, reunited the Vanguard, and retook the City.',
    cause: '红军团试图夺取旅者及其光，而不是接受旅者的选择。', causeEn: 'The Red Legion sought to seize the Traveler and its Light rather than accept the Traveler’s choice.',
    consequence: '旅者苏醒并向宇宙发出信号，也暴露了自己的位置。', consequenceEn: 'The Traveler awakened and sent a signal across the universe, revealing its location.',
    destination: '最后之城', destinationEn: 'The Last City', relatedIds: ['last-city', 'vanguard', 'caiatl', 'pyramid-return'], sourceIds: ['red-war'], verifiedAt: '2026-09-14'
  },
  {
    id: 'forsaken-event', order: 70, name: '凯德之死与梦之城诅咒', nameEn: 'Cayde’s death and the Dreaming City curse', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '凯德-6在监狱暴动中被阿尔登杀死。守护者的复仇最终揭开更深的操纵，并让梦之城陷入循环诅咒。', summaryEn: 'Cayde-6 was killed by Uldren during a prison break. The Guardian’s pursuit of revenge exposed deeper manipulation and left the Dreaming City trapped in a repeating curse.',
    cause: '瑞文与萨瓦图恩利用阿尔登的执念和腐化推动越狱。', causeEn: 'Riven and Savathûn exploited Uldren’s obsession and corruption to drive the prison break.',
    consequence: '阿尔登死后被复活为渡鸦，身份、记忆与责任成为长期角色主线。', consequenceEn: 'After Uldren died, he was resurrected as Crow, beginning a long arc about identity, memory, and responsibility.',
    destination: '纷乱海岸与梦之城', destinationEn: 'Tangled Shore and Dreaming City', relatedIds: ['cayde', 'crow', 'mara', 'savathun'], sourceIds: ['forsaken'], verifiedAt: '2026-09-14'
  },
  {
    id: 'pyramid-return', order: 80, name: '黑舰队归来', nameEn: 'The Black Fleet returns', eraId: 'light-dark', spoilerLevel: 1,
    summary: '旅者在红战争中的苏醒引来黑舰队。金字塔抵达后，守护者开始直接接触暗并质疑光暗等同善恶的旧理解。', summaryEn: 'The Traveler’s awakening during the Red War drew the Black Fleet back. As the Pyramids arrived, Guardians directly encountered the Darkness and questioned the old equation of Light with good and Darkness with evil.',
    cause: '旅者苏醒时发出的能量波被遥远的黑舰队感知。', causeEn: 'The Black Fleet detected the wave of energy released when the Traveler awakened.',
    consequence: '守护者后来掌握冰凝，见证者也逐渐从幕后现身。', consequenceEn: 'Guardians later learned to wield Stasis, while the Witness gradually emerged from behind the conflict.',
    destination: '月球、欧罗巴与太阳系', destinationEn: 'Moon, Europa, and the solar system', relatedIds: ['darkness', 'witness', 'vanguard', 'witness-arrives'], sourceIds: ['arrivals'], verifiedAt: '2026-09-14'
  },
  {
    id: 'witness-arrives', order: 90, name: '见证者开启传送门', nameEn: 'The Witness opens the portal', eraId: 'light-dark', spoilerLevel: 2,
    summary: '见证者抵达地球，在旅者表面开启通往苍白之心的传送门，开始实施终焉之形。', summaryEn: 'The Witness reached Earth and opened a portal into the Pale Heart on the Traveler’s surface, beginning its attempt to enact the Final Shape.',
    cause: '见证者取得面纱与旅者之间的连接。', causeEn: 'The Witness established a connection between the Veil and the Traveler.',
    consequence: '先锋必须找到穿越传送门的方法，在旅者内部发动最后攻势。', consequenceEn: 'The Vanguard had to find a way through the portal and mount a final offensive inside the Traveler.',
    destination: '地球轨道与苍白之心', destinationEn: 'Earth orbit and the Pale Heart', relatedIds: ['witness', 'traveler', 'final-shape-concept', 'witness-defeated'], sourceIds: ['lightfall', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'witness-defeated', order: 100, name: '见证者战败', nameEn: 'The Witness is defeated', eraId: 'light-dark', spoilerLevel: 2,
    summary: '守护者与盟友进入苍白之心，借助见证者内部仍在反抗的意识，最终在万众一心中将其消灭。', summaryEn: 'Guardians and their allies entered the Pale Heart, used the dissenting consciousnesses within the Witness, and finally destroyed it in Excision.',
    cause: '见证者试图把整个宇宙固定为终焉之形。', causeEn: 'The Witness attempted to freeze the entire universe into the Final Shape.',
    consequence: '光与暗传奇结束，但光、暗以及太阳系的未解问题仍然存在。', consequenceEn: 'The Light and Darkness Saga ended, while the powers themselves and many mysteries of the solar system remained.',
    destination: '苍白之心', destinationEn: 'Pale Heart', relatedIds: ['player-guardian', 'witness', 'cayde', 'vanguard', 'final-shape-concept'], sourceIds: ['final-shape'], verifiedAt: '2026-09-14'
  }
]

export const loreFactions = [
  {
    id: 'last-city', name: '最后之城', nameEn: 'The Last City', species: '人类、觉醒者、Exo 与盟友', speciesEn: 'Humans, Awoken, Exos, and allies', alignment: 'allied', alignmentZh: '守护者同盟', alignmentEn: 'Guardian coalition', eraId: 'city-age', spoilerLevel: 0,
    summary: '崩塌后人类文明的核心聚居地。它既是守护者保护的家园，也是不同种族逐步学习共存的政治共同体。', summaryEn: 'The central home of human civilization after the Collapse, both the community Guardians defend and a political coalition learning to include former enemies.',
    relatedIds: ['traveler', 'guardians', 'vanguard', 'house-light', 'imperial-cabal'], sourceIds: ['destiny-campaign', 'red-war'], verifiedAt: '2026-09-14'
  },
  {
    id: 'vanguard', name: '先锋', nameEn: 'The Vanguard', species: '多种族守护者', speciesEn: 'Guardians of multiple peoples', alignment: 'allied', alignmentZh: '守护者同盟', alignmentEn: 'Guardian coalition', eraId: 'city-age', spoilerLevel: 0,
    summary: '协调守护者行动并保卫最后之城的领导体系。它不是所有承光者的天然上级，而是城市时代形成的组织。', summaryEn: 'The leadership structure coordinating Guardian operations and defending the Last City. It is an institution of the City Age, not the automatic authority over every Lightbearer.',
    relatedIds: ['guardians', 'last-city', 'zavala', 'ikora', 'cayde'], sourceIds: ['destiny-campaign', 'red-war'], verifiedAt: '2026-09-14'
  },
  {
    id: 'house-light', name: '光之屋', nameEn: 'House of Light', species: '埃尔克斯尼', speciesEn: 'Eliksni', alignment: 'allied', alignmentZh: '守护者同盟', alignmentEn: 'Guardian coalition', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '米斯拉克斯领导的埃尔克斯尼家族，拒绝继续以人类为必然敌人，并在最后之城建立新的生活。', summaryEn: 'An Eliksni House led by Mithrax that rejects humanity as an inevitable enemy and has built a new life within the Last City.',
    relatedIds: ['mithrax', 'last-city', 'vanguard'], sourceIds: ['arrivals'], verifiedAt: '2026-09-14'
  },
  {
    id: 'imperial-cabal', name: '帝国卡巴尔', nameEn: 'Imperial Cabal', species: '卡巴尔', speciesEn: 'Cabal', alignment: 'allied', alignmentZh: '守护者同盟', alignmentEn: 'Guardian coalition', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '凯亚特尔女皇领导的卡巴尔势力。它与曾入侵最后之城的红军团不同，后来与先锋建立军事同盟。', summaryEn: 'The Cabal faction led by Empress Caiatl. Distinct from the Red Legion that invaded the Last City, it later formed a military alliance with the Vanguard.',
    relatedIds: ['caiatl', 'vanguard', 'last-city'], sourceIds: ['lightfall'], verifiedAt: '2026-09-14'
  },
  {
    id: 'hive-pantheon', name: '邪魔族神系', nameEn: 'Hive pantheon', species: '邪魔族', speciesEn: 'Hive', alignment: 'hostile', alignmentZh: '敌对势力', alignmentEn: 'Hostile power', eraId: 'all-eras', spoilerLevel: 1,
    summary: '由欧里克斯、萨瓦图恩与希乌·阿拉斯等塑造的古老文明，以剑之逻辑、虫神契约和王座世界延续自身。内部并非始终目标一致。', summaryEn: 'An ancient civilization shaped by Oryx, Savathûn, Xivu Arath, the Sword Logic, worm pacts, and throne worlds. Its leading powers do not always share the same goals.',
    relatedIds: ['oryx', 'savathun', 'lucent-brood', 'taken-war'], sourceIds: ['taken-king', 'witch-queen'], verifiedAt: '2026-09-14'
  },
  {
    id: 'lucent-brood', name: '光明邪魔族', nameEn: 'Lucent Brood', species: '邪魔族承光者', speciesEn: 'Hive Lightbearers', alignment: 'contested', alignmentZh: '利益冲突', alignmentEn: 'Conflicted', eraId: 'light-dark', spoilerLevel: 1,
    summary: '萨瓦图恩获得光后形成的邪魔族势力。它证明光不会按照种族或传统阵营自动区分善恶。', summaryEn: 'The Hive faction formed after Savathûn received the Light, demonstrating that the Light does not automatically sort morality by species or traditional allegiance.',
    relatedIds: ['savathun', 'light', 'ghosts', 'hive-pantheon'], sourceIds: ['witch-queen'], verifiedAt: '2026-09-14'
  },
  {
    id: 'witness-forces', name: '见证者军势', nameEn: 'Forces of the Witness', species: '多种来源', speciesEn: 'Multiple origins', alignment: 'hostile', alignmentZh: '敌对势力', alignmentEn: 'Hostile power', eraId: 'light-dark', spoilerLevel: 1,
    summary: '由见证者控制或塑造的军队，包括被夺者、暗影军团、门徒与终焉族。它们共享指挥者，但并不是一个单一物种。', summaryEn: 'Armies controlled or shaped by the Witness, including Taken, Shadow Legion, Disciples, and the Dread. They shared a commander but were not one species.',
    relatedIds: ['witness', 'darkness', 'pyramid-return', 'witness-arrives'], sourceIds: ['lightfall', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'vex-collective', name: '维克斯集群', nameEn: 'Vex collectives', species: '维克斯', speciesEn: 'Vex', alignment: 'independent', alignmentZh: '独立威胁', alignmentEn: 'Independent threat', eraId: 'all-eras', spoilerLevel: 0,
    summary: '由放射虫心智与机械躯体组成的集群网络，以模拟、转换和延续自身模式为目标。不同集群会围绕不同环境与任务行动。', summaryEn: 'Networked collectives of radiolarian minds and mechanical frames that simulate and convert reality to perpetuate their pattern. Different collectives pursue different environments and tasks.',
    relatedIds: ['black-garden', 'osiris'], sourceIds: ['destiny-campaign'], verifiedAt: '2026-09-14'
  }
]

export const loreCharacters = [
  {
    id: 'player-guardian', name: '玩家守护者', nameEn: 'The Guardian', aliases: ['年轻的狼'], aliasesEn: ['Young Wolf'], roleZh: '玩家角色', roleEn: 'Player character', alignment: 'allied', alignmentZh: '先锋', alignmentEn: 'Vanguard', statusZh: '活跃', statusEn: 'Active', eraId: 'guardian-era', spoilerLevel: 0,
    summary: '在旧俄罗斯被幽灵复活的守护者，先后参与太阳系最关键的战役。其身份由玩家塑造，但重大行动构成主线的共同历史。', summaryEn: 'A Guardian resurrected in Old Russia who participates in the system’s defining conflicts. Players shape the identity, while major actions form a shared narrative history.',
    relatedIds: ['ghosts', 'vanguard', 'black-garden', 'witness-defeated'], sourceIds: ['destiny-campaign', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'zavala', name: '萨瓦拉', nameEn: 'Zavala', aliases: [], aliasesEn: [], roleZh: '先锋指挥官', roleEn: 'Vanguard Commander', alignment: 'allied', alignmentZh: '先锋', alignmentEn: 'Vanguard', statusZh: '活跃', statusEn: 'Active', eraId: 'city-age', spoilerLevel: 0,
    summary: '以守护最后之城为首要责任的泰坦领袖。他的故事持续追问：永生的守护者如何面对失去、信仰动摇与普通人的脆弱。', summaryEn: 'A Titan leader defined by responsibility to the Last City. His story repeatedly asks how an immortal Guardian lives with loss, shaken faith, and ordinary human vulnerability.',
    relatedIds: ['vanguard', 'last-city', 'ikora', 'caiatl'], sourceIds: ['red-war', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'ikora', name: '伊科拉·蕾', nameEn: 'Ikora Rey', aliases: ['伊科拉'], aliasesEn: ['Ikora'], roleZh: '术士先锋', roleEn: 'Warlock Vanguard', alignment: 'allied', alignmentZh: '先锋', alignmentEn: 'Vanguard', statusZh: '活跃', statusEn: 'Active', eraId: 'city-age', spoilerLevel: 0,
    summary: '术士先锋与隐秘情报网的领导者。她在理性调查、导师责任以及对光的信念之间维持平衡。', summaryEn: 'Warlock Vanguard and leader of the Hidden intelligence network, balancing rigorous investigation, responsibility as a mentor, and faith in the Light.',
    relatedIds: ['vanguard', 'zavala', 'cayde', 'osiris'], sourceIds: ['red-war', 'witch-queen'], verifiedAt: '2026-09-14'
  },
  {
    id: 'cayde', name: '凯德-6', nameEn: 'Cayde-6', aliases: [], aliasesEn: [], roleZh: '前猎人先锋', roleEn: 'Former Hunter Vanguard', alignment: 'allied', alignmentZh: '先锋', alignmentEn: 'Vanguard', statusZh: '已牺牲', statusEn: 'Deceased', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '以幽默掩饰创伤的 Exo 猎人。他在《遗落之族》中死亡，并在苍白之心短暂回归，最终把自己的光交给玩家的幽灵。', summaryEn: 'An Exo Hunter who masked trauma with humor. He died in Forsaken, returned briefly within the Pale Heart, and ultimately gave his Light to the player’s Ghost.',
    relatedIds: ['vanguard', 'crow', 'forsaken-event', 'witness-defeated'], sourceIds: ['forsaken', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'crow', name: '渡鸦', nameEn: 'Crow', aliases: ['阿尔登·索夫'], aliasesEn: ['Uldren Sov'], roleZh: '守护者、前觉醒者王子', roleEn: 'Guardian, former Awoken prince', alignment: 'allied', alignmentZh: '先锋盟友', alignmentEn: 'Vanguard ally', statusZh: '活跃', statusEn: 'Active', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '阿尔登死后失去记忆，被幽灵复活为渡鸦。他没有继承旧人格的罪责，却必须面对阿尔登造成的伤害，并自行决定要成为什么人。', summaryEn: 'After Uldren died, a Ghost resurrected him without his memories as Crow. He did not inherit his former self’s guilt, but had to confront that harm and decide who to become.',
    relatedIds: ['cayde', 'mara', 'forsaken-event', 'vanguard'], sourceIds: ['forsaken', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'mara', name: '玛拉·索夫', nameEn: 'Mara Sov', aliases: ['觉醒者女王'], aliasesEn: ['Awoken Queen'], roleZh: '觉醒者女王', roleEn: 'Queen of the Awoken', alignment: 'allied', alignmentZh: '礁石与梦之城', alignmentEn: 'Reef and Dreaming City', statusZh: '活跃', statusEn: 'Active', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '以长远计划保护觉醒者与太阳系的女王。她强大的控制欲和保密习惯也给阿尔登、盟友及自己造成了代价。', summaryEn: 'The Awoken queen whose long plans protect her people and the solar system, while her need for control and secrecy exacts a cost from Uldren, her allies, and herself.',
    relatedIds: ['crow', 'forsaken-event', 'witness-defeated'], sourceIds: ['forsaken', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'mithrax', name: '米斯拉克斯', nameEn: 'Mithrax', aliases: ['光之凯尔'], aliasesEn: ['Kell of Light'], roleZh: '光之屋领袖', roleEn: 'Kell of the House of Light', alignment: 'allied', alignmentZh: '光之屋', alignmentEn: 'House of Light', statusZh: '活跃', statusEn: 'Active', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '选择与人类合作的埃尔克斯尼领袖。他既要带领族人摆脱旧仇，也必须承担自己曾经作为海盗犯下的罪行。', summaryEn: 'An Eliksni leader who chose cooperation with humanity, guiding his people beyond old hatred while reckoning with violence from his own past.',
    relatedIds: ['house-light', 'last-city', 'vanguard'], sourceIds: ['arrivals'], verifiedAt: '2026-09-14'
  },
  {
    id: 'caiatl', name: '凯亚特尔', nameEn: 'Caiatl', aliases: ['卡巴尔女皇'], aliasesEn: ['Empress of the Cabal'], roleZh: '卡巴尔女皇', roleEn: 'Empress of the Cabal', alignment: 'allied', alignmentZh: '帝国卡巴尔', alignmentEn: 'Imperial Cabal', statusZh: '活跃', statusEn: 'Active', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '在故乡沦陷后领导卡巴尔帝国的女皇。她通过仪式、力量与现实政治逐步从先锋的对手转变为可靠盟友。', summaryEn: 'Empress of the Cabal after the fall of their homeworld, gradually moving from Vanguard rival to reliable ally through ritual, strength, and practical politics.',
    relatedIds: ['imperial-cabal', 'zavala', 'vanguard'], sourceIds: ['lightfall'], verifiedAt: '2026-09-14'
  },
  {
    id: 'osiris', name: '欧西里斯', nameEn: 'Osiris', aliases: [], aliasesEn: [], roleZh: '传奇术士', roleEn: 'Legendary Warlock', alignment: 'allied', alignmentZh: '先锋盟友', alignmentEn: 'Vanguard ally', statusZh: '失去光，仍活跃', statusEn: 'Lightless, active', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '曾被先锋放逐的研究者，以对维克斯和预言的执着闻名。失去萨吉拉与光后，他仍依靠知识、缚丝研究和圣-14继续战斗。', summaryEn: 'An exiled Vanguard scholar known for his obsession with the Vex and prophecy. After losing Sagira and the Light, he continues through knowledge, Strand research, and his bond with Saint-14.',
    relatedIds: ['ikora', 'vex-collective', 'witness-arrives'], sourceIds: ['lightfall'], verifiedAt: '2026-09-14'
  },
  {
    id: 'rasputin', name: '拉斯普京', nameEn: 'Rasputin', aliases: ['战争思维'], aliasesEn: ['The Warmind'], roleZh: '黄金时代战争思维', roleEn: 'Golden Age Warmind', alignment: 'allied', alignmentZh: '人类遗产', alignmentEn: 'Humanity', statusZh: '已牺牲', statusEn: 'Deceased', eraId: 'foundations', spoilerLevel: 1,
    summary: '黄金时代建立的战略人工智能，长期以功利方式保护人类。最终选择牺牲自己，阻止自身武器被用于毁灭旅者。', summaryEn: 'A strategic intelligence built in the Golden Age that protected humanity through harsh calculation, ultimately choosing self-sacrifice to stop its weapons from being used against the Traveler.',
    relatedIds: ['golden-age', 'traveler', 'witness-forces'], sourceIds: ['destiny-campaign'], verifiedAt: '2026-09-14'
  },
  {
    id: 'oryx', name: '欧里克斯', nameEn: 'Oryx', aliases: ['被夺之王'], aliasesEn: ['The Taken King'], roleZh: '邪魔族之王', roleEn: 'Hive god-king', alignment: 'hostile', alignmentZh: '邪魔族神系', alignmentEn: 'Hive pantheon', statusZh: '已被击败', statusEn: 'Defeated', eraId: 'guardian-era', spoilerLevel: 1,
    summary: '邪魔族三姐弟之一，通过理解“夺取”成为被夺之王。他对剑之逻辑的信仰把家庭、征服与生存绑定在一起。', summaryEn: 'One of the three Hive siblings who became the Taken King by learning the power to Take, binding family, conquest, and survival through devotion to the Sword Logic.',
    relatedIds: ['hive-pantheon', 'taken-war', 'savathun'], sourceIds: ['taken-king'], verifiedAt: '2026-09-14'
  },
  {
    id: 'savathun', name: '萨瓦图恩', nameEn: 'Savathûn', aliases: ['邪姬'], aliasesEn: ['The Witch Queen'], roleZh: '诡计之神', roleEn: 'Hive god of cunning', alignment: 'contested', alignmentZh: '光明邪魔族', alignmentEn: 'Lucent Brood', statusZh: '活跃，利益不定', statusEn: 'Active, competing interests', eraId: 'light-dark', spoilerLevel: 1,
    summary: '以欺骗求生的邪魔族神祇。她背叛见证者并获得光，既是守护者的敌人，也在阻止终焉之形时成为不可忽视的临时合作者。', summaryEn: 'A Hive god who survives through deception. She betrayed the Witness and received the Light, remaining both a Guardian adversary and an indispensable temporary collaborator against the Final Shape.',
    relatedIds: ['hive-pantheon', 'lucent-brood', 'witness', 'forsaken-event'], sourceIds: ['witch-queen', 'final-shape'], verifiedAt: '2026-09-14'
  },
  {
    id: 'witness', name: '见证者', nameEn: 'The Witness', aliases: [], aliasesEn: [], roleZh: '黑舰队领导者', roleEn: 'Leader of the Black Fleet', alignment: 'hostile', alignmentZh: '见证者军势', alignmentEn: 'Forces of the Witness', statusZh: '已被击败', statusEn: 'Defeated', eraId: 'light-dark', spoilerLevel: 2,
    summary: '由一个古老文明融合而成的集体意识。它把宇宙中的痛苦归因于无意义与变化，企图以终焉之形替所有生命作出最终选择。', summaryEn: 'A collective consciousness formed from an ancient civilization. It blamed suffering on purposeless change and sought to make the final choice for all life through the Final Shape.',
    relatedIds: ['darkness', 'witness-forces', 'final-shape-concept', 'collapse', 'witness-defeated'], sourceIds: ['witch-queen', 'lightfall', 'final-shape'], verifiedAt: '2026-09-14'
  }
]

export const loreReleases = [
  { id: 'release-destiny', year: 2014, name: '命运', nameEn: 'Destiny', sagaId: 'light-dark', sagaZh: '光与暗传奇', sagaEn: 'Light and Darkness Saga', eraId: 'guardian-era', spoilerLevel: 0, destination: '旧俄罗斯、月球、金星、火星', destinationEn: 'Cosmodrome, Moon, Venus, and Mars', feature: '守护者起源与黑色花园', featureEn: 'Guardian origin and the Black Garden', relatedIds: ['black-garden', 'player-guardian'], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-taken-king', year: 2015, name: '被夺之王', nameEn: 'The Taken King', sagaId: 'light-dark', sagaZh: '光与暗传奇', sagaEn: 'Light and Darkness Saga', eraId: 'guardian-era', spoilerLevel: 1, destination: '无畏战舰', destinationEn: 'Dreadnaught', feature: '被夺者、第三子职业分支', featureEn: 'Taken and third subclass branches', relatedIds: ['taken-war', 'oryx'], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-red-war', year: 2017, name: '红战争', nameEn: 'The Red War', sagaId: 'light-dark', sagaZh: '光与暗传奇', sagaEn: 'Light and Darkness Saga', eraId: 'guardian-era', spoilerLevel: 1, destination: '欧洲死区、泰坦、奈瑟斯、木卫一', destinationEn: 'EDZ, Titan, Nessus, and Io', feature: '《命运2》本体战役', featureEn: 'Destiny 2 launch campaign', relatedIds: ['red-war-event', 'last-city'], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-forsaken', year: 2018, name: '遗落之族', nameEn: 'Forsaken', sagaId: 'light-dark', sagaZh: '光与暗传奇', sagaEn: 'Light and Darkness Saga', eraId: 'guardian-era', spoilerLevel: 1, destination: '纷乱海岸、梦之城', destinationEn: 'Tangled Shore and Dreaming City', feature: '凯德之死、梦之城、赛季年票', featureEn: 'Cayde’s death, Dreaming City, and Annual Pass', relatedIds: ['forsaken-event', 'cayde', 'crow'], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-shadowkeep', year: 2019, name: '暗影要塞', nameEn: 'Shadowkeep', sagaId: 'light-dark', sagaZh: '光与暗传奇', sagaEn: 'Light and Darkness Saga', eraId: 'light-dark', spoilerLevel: 1, destination: '月球', destinationEn: 'Moon', feature: '金字塔线索、护甲 2.0、赛季神器', featureEn: 'Pyramid clues, Armor 2.0, and seasonal artifact', relatedIds: ['pyramid-return'], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-beyond-light', year: 2020, name: '凌光之刻', nameEn: 'Beyond Light', sagaId: 'light-dark', sagaZh: '光与暗传奇', sagaEn: 'Light and Darkness Saga', eraId: 'light-dark', spoilerLevel: 1, destination: '欧罗巴', destinationEn: 'Europa', feature: '冰凝与暗影能力', featureEn: 'Stasis and Darkness powers', relatedIds: ['darkness', 'pyramid-return'], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-witch-queen', year: 2022, name: '邪姬魅影', nameEn: 'The Witch Queen', sagaId: 'light-dark', sagaZh: '光与暗传奇', sagaEn: 'Light and Darkness Saga', eraId: 'light-dark', spoilerLevel: 1, destination: '萨瓦图恩的王座世界', destinationEn: 'Savathûn’s Throne World', feature: '光明邪魔族与武器锻造', featureEn: 'Lucent Brood and weapon crafting', relatedIds: ['savathun', 'lucent-brood'], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-lightfall', year: 2023, name: '光陨之秋', nameEn: 'Lightfall', sagaId: 'light-dark', sagaZh: '光与暗传奇', sagaEn: 'Light and Darkness Saga', eraId: 'light-dark', spoilerLevel: 2, destination: '奈奥姆那', destinationEn: 'Neomuna', feature: '缚丝与见证者入侵', featureEn: 'Strand and the Witness’s invasion', relatedIds: ['witness-arrives', 'osiris'], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-final-shape', year: 2024, name: '终焉之形', nameEn: 'The Final Shape', sagaId: 'light-dark', sagaZh: '光与暗传奇', sagaEn: 'Light and Darkness Saga', eraId: 'light-dark', spoilerLevel: 2, destination: '苍白之心', destinationEn: 'Pale Heart', feature: '棱镜与光暗传奇结局', featureEn: 'Prismatic and the saga finale', relatedIds: ['witness-defeated', 'final-shape-concept'], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-edge-of-fate', year: 2025, name: '宿命边缘', nameEn: 'The Edge of Fate', sagaId: 'fate', sagaZh: '命运传奇', sagaEn: 'Fate Saga', eraId: 'fate', spoilerLevel: 2, destination: '开普勒', destinationEn: 'Kepler', feature: '命运传奇开篇、门户与装备分层', featureEn: 'Fate Saga opening, Portal, and gear tiers', relatedIds: [], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' },
  { id: 'release-renegades', year: 2025, name: '叛逃者', nameEn: 'Renegades', sagaId: 'fate', sagaZh: '命运传奇', sagaEn: 'Fate Saga', eraId: 'fate', spoilerLevel: 2, destination: '法外边境', destinationEn: 'Lawless Frontier', feature: '法外主题与新武器原型', featureEn: 'Outlaw theme and new weapon archetypes', relatedIds: [], sourceIds: ['bungie-release-history'], verifiedAt: '2026-09-14' }
]

// Transitional exports retained for older imports. The redesigned page uses normalized records above.
export const enemyRaces = [
  { id: 'cabal', name: '卡巴尔', en: 'Cabal', type: '重装军团', desc: '星际帝国，军事化重甲。派系：红军团、帝国军团、暗影军团、Barant帝国。', units: ['盾兵 Phalanx', '百夫长 Centurion', '巨人 Colossus', '灵能者 Psion', '战争猎犬 War Beast'] },
  { id: 'fallen', name: '埃尔克斯尼（堕落者）', en: 'Fallen / Eliksni', type: '海盗/掠夺', desc: '多足类海盗种族，依赖以太存活。部落：狼之屋、国王之屋、救赎之屋、放逐之屋、光之屋（盟友）。', units: ['杂兵 Dreg', '强盗 Vandal', '船长 Captain', '伺服器 Servitor', '大祭司 Archon'] },
  { id: 'hive', name: '邪魔族', en: 'Hive', type: '黑暗生物', desc: '崇拜黑暗的古老种族，拥有王座世界机制。神系：欧里克斯、萨瓦图恩、希乌 / 阿拉斯。光之邪魔族（Lucent Hive）获得光能。', units: ['虫群 Thrall', '侍从 Acolyte', '骑士 Knight', '巫师 Wizard', '食人魔 Ogre', '尖叫者 Shrieker'] },
  { id: 'taken', name: '被夺者', en: 'Taken', type: '转化生物', desc: '被黑暗"夺取"转化的各族生物，黑雾包裹，具有传送与免疫机制。', units: ['被夺系各类兵种'] },
  { id: 'vex', name: '维克司', en: 'Vex', type: '机械军团', desc: '时间旅行的机械蜂群，模拟并改造现实。拥有无穷森林与黑花园。', units: ['哥布林 Goblin', '霍布哥布林 Hobgoblin', '弥诺陶洛斯 Minotaur', '九头蛇 Hydra', '独眼 Cyclops', '飞龙 Wyvern'] },
  { id: 'scorn', name: '蔑视者', en: 'Scorn', type: '亡灵堕落者', desc: '被黑暗复活的堕落者，半机械半亡灵。', units: ['自爆者 Screeb', '袭击者 Raider', '酋长 Chieftain', '憎恶 Abomination'] },
  { id: 'dread', name: '终焉', en: 'Dread', type: '黑暗军队', desc: '见证者的直属军队（终焉之形），融合多种黑暗造物。', units: ['压制者 Subjugator', '群鸦 Grim'] }
]

export const characters = loreCharacters.map(item => ({ id: item.id, name: item.name, en: item.nameEn, role: item.roleEn, desc: item.summaryEn, villain: item.alignment === 'hostile' }))
export const expansions = loreReleases.map(item => ({ year: String(item.year), name: item.name, en: item.nameEn, feature: item.featureEn, destination: item.destinationEn, saga: item.sagaEn }))
export const sagas = [
  { id: 'light-darkness', name: '光与暗传奇', en: 'The Light and Darkness Saga', years: '2014–2024', desc: '覆盖《命运1》到《命运2：终焉之形》的十年主线。见证者、旅者、光与暗的史诗对抗，以终焉之形击败见证者收官。', key: ['命运1五部内容', '红战争', '遗落之族', '暗影要塞', '凌光之刻', '邪姬魅影', '光陨之秋', '终焉之形'] },
  { id: 'fate', name: '命运传奇', en: 'The Fate Saga', years: '2025–2026', desc: '第二个十年，采用每年两部资料片的新模式（预言之年）。以《宿命边缘》开篇、随《凯旋纪念碑》收官；后续《碎裂循环》《炼金术士》被取消。', key: ['宿命边缘(2025.7)', '叛逃者(2025.12)', '凯旋纪念碑(2026.6)', '原计划:碎裂循环/炼金术士(取消)'] }
]
