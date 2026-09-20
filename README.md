# tarot_shuffle
A small browser-based tarot drawing and study tool.
# 塔罗研习台

一款完全离线的 Rider–Waite–Smith 塔罗抽牌与学习工具。无需安装软件、无需网络、无需本地服务器。

## 使用方法

直接双击项目根目录中的 **`index.html`**。

推荐使用当前版本的 Chrome、Edge 或 Firefox。页面地址以 `file:///.../index.html` 开头是正常的。

## 基本流程

1. 可选填写牌阵名称和牌位名称；牌位名称每行一个。
2. 点击“开始新回合”。程序会洗牌一次，并为 78 张实体牌分别固定正位或逆位。
3. 手动输入 1–78 的数字并点击“Draw · 翻牌”。程序不会替你随机选择数字。
4. 主牌阵完成后，可在“Clarification Draw”区域继续输入其他数字。
5. 补充抽牌沿用同一副牌、同一临时编号和同一方向，不会重新洗牌。
6. 点击“结束回合”清除本次记录；下一次开始会创建新的随机映射和 Round ID。

如果填写了牌位，牌位数量必须与主抽牌数字数量一致。输入有误时，本回合不会重新洗牌。

## 项目结构

```text
tarot-study-app/
├── index.html                 # 双击这个文件使用
├── style.css                  # 页面样式
├── script.js                  # 洗牌、正逆位、验证和显示逻辑
├── data/
│   ├── tarot-data.js          # 供 file:// 页面直接读取的数据
│   └── tarot-rws.zh-CN.json   # 保留的原始数据与来源说明
└── images/
    ├── major/                 # 22 张大阿卡那
    ├── wands/                 # 14 张权杖
    ├── cups/                  # 14 张圣杯
    ├── swords/                # 14 张宝剑
    └── pentacles/             # 14 张星币
```

`tarot-data.js` 是从原始 JSON 转换出的普通 JavaScript 数据文件，因此浏览器直接打开本地文件时不需要 `fetch()`。如果以后修改了原始 JSON，请同步重新生成 `tarot-data.js`。

## 数据与牌义

数据包含完整 78 张实体牌、中文与英文牌名、牌组分类、图片路径，以及正位和逆位学习关键词。关键词来源说明保存在 `data/tarot-rws.zh-CN.json` 的 `source_notes` 与 `sources` 字段中。

塔罗适合用作反思与学习工具，不应替代医疗、法律、财务或安全方面的专业判断。
