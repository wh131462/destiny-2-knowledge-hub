# 护甲原型图标

这些 PNG 来自 Bungie 官方 Manifest，文件名保留官方图标路径的原始文件名。

- 来源：`https://www.bungie.net/common/destiny2_content/icons/<文件名>`
- 对应目录：`data/catalog/manifest-armor.json` 的 `archetypes[].icon`
- 下载日期：2026-09-09
- 用途：随站点发布护甲原型图标，避免浏览时依赖外部图片请求。多个原型可能共享官方图标。

更新 Manifest 后，如出现新的原型图标路径，将对应官方 PNG 加入此目录。组件按原始文件名匹配本地资源，新路径尚未缓存时回退到官方 URL；加载失败显示文字占位。
