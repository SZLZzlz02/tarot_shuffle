# 图片放置说明

把 78 张牌面图按 `../data/tarot-rws.zh-CN.json` 的 `image` 字段放入对应目录。

约定：

- 大阿卡那使用“编号 + 下划线 + 英文牌名”，例如 `major/00_Fool.jpg`、`major/02_High_Priestess.jpg`、`major/21_World.jpg`。
- 四个花色分别放在 `wands/`、`cups/`、`swords/`、`pentacles/`。
- 小阿卡那文件名使用花色前缀加两位编号：`Wands01.jpg`、`Cups01.jpg`、`Swords01.jpg`、`Pents01.jpg`。
- `01`–`10` 对应王牌到十；`11`–`14` 依次对应侍从、骑士、王后、国王。

例如：

```text
wands/Wands01.jpg
cups/Cups02.jpg
swords/Swords13.jpg
pentacles/Pents10.jpg
```

如果你的图片是 PNG 或 WebP，可以批量修改 JSON 中的扩展名；不要只改图片文件而忘记同步路径。
