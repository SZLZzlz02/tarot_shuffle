"use strict";

// All state for a round lives here. The mapping and orientations are created
// exactly once in startRound() and remain unchanged until endRound().
const state = {
  roundId: null,
  deck: [],
  drawnNumbers: new Set(),
  mainDrawComplete: false,
  clarificationCount: 0,
  dataReady: false
};

const elements = {
  roundPill: document.querySelector("#roundPill"),
  roundStatus: document.querySelector("#roundStatus"),
  endRoundButton: document.querySelector("#endRoundButton"),
  spreadName: document.querySelector("#spreadName"),
  spreadPositions: document.querySelector("#spreadPositions"),
  startRoundButton: document.querySelector("#startRoundButton"),
  dataNote: document.querySelector("#dataNote"),
  drawPanel: document.querySelector("#drawPanel"),
  mainRoundReference: document.querySelector("#mainRoundReference"),
  mainNumbers: document.querySelector("#mainNumbers"),
  drawButton: document.querySelector("#drawButton"),
  mainMessage: document.querySelector("#mainMessage"),
  mainReading: document.querySelector("#mainReading"),
  mainReadingHeading: document.querySelector("#mainReadingHeading"),
  readingRoundReference: document.querySelector("#readingRoundReference"),
  mainCardGrid: document.querySelector("#mainCardGrid"),
  clarificationSection: document.querySelector("#clarificationSection"),
  clarificationRoundReference: document.querySelector("#clarificationRoundReference"),
  clarificationLabel: document.querySelector("#clarificationLabel"),
  clarificationNumbers: document.querySelector("#clarificationNumbers"),
  clarificationButton: document.querySelector("#clarificationButton"),
  clarificationMessage: document.querySelector("#clarificationMessage"),
  drawnHistory: document.querySelector("#drawnHistory"),
  clarificationResults: document.querySelector("#clarificationResults"),
  developerError: document.querySelector("#developerError"),
  developerErrorText: document.querySelector("#developerErrorText")
};

function validateSourceData(cards) {
  if (!Array.isArray(cards)) {
    throw new Error("TAROT_CARDS 不是有效数组。");
  }

  if (cards.length !== 78) {
    throw new Error(`牌组必须包含 78 张实体牌；目前检测到 ${cards.length} 张。`);
  }

  const ids = new Set();
  for (const [index, card] of cards.entries()) {
    if (!card || typeof card !== "object") {
      throw new Error(`第 ${index + 1} 条牌组记录无效。`);
    }
    if (!card.id) {
      throw new Error(`第 ${index + 1} 条牌组记录缺少 id。`);
    }
    if (ids.has(card.id)) {
      throw new Error(`发现重复牌 ID：${card.id}`);
    }
    ids.add(card.id);
  }
}

function fisherYatesShuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function generateRoundId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(6);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < values.length; i += 1) {
      values[i] = Math.floor(Math.random() * 1_000_000);
    }
  }
  return `R-${Array.from(values, value => alphabet[value % alphabet.length]).join("")}`;
}

function validateRoundDeck(deck) {
  if (!Array.isArray(deck) || deck.length !== 78) {
    throw new Error("本回合牌组不是完整的 78 张牌。");
  }

  const ids = new Set(deck.map(card => card.id));
  const numbers = new Set(deck.map(card => card.drawNumber));
  const orientationsAreValid = deck.every(card => card.orientation === "upright" || card.orientation === "reversed");

  if (ids.size !== 78) throw new Error("本回合出现了重复实体牌。");
  if (numbers.size !== 78 || !Array.from({ length: 78 }, (_, i) => i + 1).every(number => numbers.has(number))) {
    throw new Error("临时数字 1–78 没有与实体牌一一对应。");
  }
  if (!orientationsAreValid) throw new Error("有牌缺少固定的正位或逆位方向。");
}

function setMessage(element, text, type = "error") {
  element.textContent = text;
  element.hidden = !text;
  element.classList.toggle("is-success", type === "success");
}

function showDeveloperError(error) {
  state.dataReady = false;
  elements.startRoundButton.disabled = true;
  elements.dataNote.textContent = "牌组数据检查失败";
  elements.developerErrorText.textContent = error instanceof Error ? error.message : String(error);
  elements.developerError.hidden = false;
}

function parsePositions(value) {
  return value
    .split(/\r?\n/)
    .map(line => line.trim().replace(/^\d+\s*[.、):：-]\s*/, ""))
    .filter(Boolean);
}

function parseDrawNumbers(value) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("请先输入至少一个抽牌数字。");

  const tokens = trimmed.split(/[\s,，、;；]+/).filter(Boolean);
  const numbers = tokens.map(token => Number(token));

  if (numbers.some(number => !Number.isInteger(number))) {
    throw new Error("所有抽牌数字都必须是整数。");
  }
  if (numbers.some(number => number < 1 || number > 78)) {
    throw new Error("抽牌数字必须在 1 到 78 之间。");
  }
  if (new Set(numbers).size !== numbers.length) {
    throw new Error("同一次输入中不能包含重复数字。");
  }

  const alreadyDrawn = numbers.find(number => state.drawnNumbers.has(number));
  if (alreadyDrawn !== undefined) {
    throw new Error(`Card number ${alreadyDrawn} has already been drawn in this round.`);
  }

  return numbers;
}

function setRoundReferences() {
  const reference = state.roundId ? `Round ID · ${state.roundId}` : "";
  elements.mainRoundReference.textContent = reference;
  elements.readingRoundReference.textContent = reference;
  elements.clarificationRoundReference.textContent = reference;
}

function lockSpreadDefinition(locked) {
  elements.spreadName.disabled = locked;
  elements.spreadPositions.disabled = locked;
}

function startRound() {
  if (!state.dataReady) return;
  if (state.roundId && state.drawnNumbers.size > 0) {
    const confirmed = window.confirm("当前回合已有抽牌记录。要结束它并创建全新的回合吗？");
    if (!confirmed) return;
  }

  try {
    // First shuffle all physical cards; then assign one fixed orientation to
    // each shuffled position for the lifetime of this round.
    const shuffledCards = fisherYatesShuffle(TAROT_CARDS.map(card => ({ ...card })));
    state.deck = shuffledCards.map((card, index) => ({
      ...card,
      drawNumber: index + 1,
      orientation: Math.random() < 0.5 ? "upright" : "reversed"
    }));
    validateRoundDeck(state.deck);

    state.roundId = generateRoundId();
    state.drawnNumbers = new Set();
    state.mainDrawComplete = false;
    state.clarificationCount = 0;

    elements.roundPill.classList.add("is-active");
    elements.roundStatus.textContent = state.roundId;
    elements.endRoundButton.hidden = false;
    elements.startRoundButton.textContent = "重新创建回合";
    elements.drawPanel.hidden = false;
    elements.mainReading.hidden = true;
    elements.clarificationSection.hidden = true;
    elements.mainCardGrid.replaceChildren();
    elements.clarificationResults.replaceChildren();
    elements.mainNumbers.value = "";
    elements.clarificationNumbers.value = "";
    elements.clarificationLabel.value = "";
    elements.drawButton.disabled = false;
    lockSpreadDefinition(false);
    setMessage(elements.mainMessage, "");
    setMessage(elements.clarificationMessage, "");
    setRoundReferences();
    updateDrawnHistory();
    elements.mainNumbers.focus();
  } catch (error) {
    showDeveloperError(error);
  }
}

function getCardForNumber(number) {
  const card = state.deck[number - 1];
  if (!card || card.drawNumber !== number) {
    throw new Error(`无法读取临时数字 ${number} 对应的牌。`);
  }
  return card;
}

function formatArcana(card) {
  if (card.arcana === "major") return "Major Arcana";
  const suits = { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" };
  return suits[card.suit] || "Minor Arcana";
}

function createCardElement(card, position, index) {
  const article = document.createElement("article");
  article.className = "reading-card";
  article.style.setProperty("--delay", `${Math.min(index * 70, 420)}ms`);

  const positionLabel = document.createElement("p");
  positionLabel.className = "position-label";
  positionLabel.textContent = position || formatArcana(card);

  const artFrame = document.createElement("div");
  artFrame.className = "art-frame";

  const image = document.createElement("img");
  image.className = `card-art${card.orientation === "reversed" ? " is-reversed" : ""}`;
  image.src = card.image || "";
  image.alt = `${card.name_en || "Tarot card"}${card.name_zh ? ` · ${card.name_zh}` : ""}`;
  image.loading = "eager";
  image.addEventListener("error", () => {
    image.remove();
    const fallback = document.createElement("p");
    fallback.className = "image-error";
    fallback.textContent = `图片无法加载：${card.image || "未提供路径"}`;
    artFrame.append(fallback);
  }, { once: true });
  artFrame.append(image);

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const drawNumber = document.createElement("span");
  drawNumber.className = "draw-number";
  drawNumber.textContent = `Draw No. ${card.drawNumber}`;

  const orientation = document.createElement("span");
  orientation.className = `orientation${card.orientation === "reversed" ? " reversed" : ""}`;
  orientation.textContent = card.orientation === "reversed" ? "Reversed · 逆位" : "Upright · 正位";
  meta.append(drawNumber, orientation);

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = card.name_en || "Unnamed card";

  const chineseTitle = document.createElement("p");
  chineseTitle.className = "card-title-zh";
  chineseTitle.textContent = card.name_zh || formatArcana(card);

  const keywords = document.createElement("p");
  keywords.className = "keywords";
  const keywordList = card.orientation === "reversed" ? card.reversed_keywords : card.upright_keywords;
  keywords.textContent = Array.isArray(keywordList) && keywordList.length ? keywordList.join(" · ") : "暂无关键词";

  article.append(positionLabel, artFrame, meta, title, chineseTitle, keywords);
  return article;
}

function renderCards(container, numbers, positions = []) {
  const fragment = document.createDocumentFragment();
  numbers.forEach((number, index) => {
    const card = getCardForNumber(number);
    fragment.append(createCardElement(card, positions[index] || "", index));
  });
  container.append(fragment);
}

function commitDraw(numbers) {
  numbers.forEach(number => state.drawnNumbers.add(number));
  updateDrawnHistory();
}

function drawMainSpread() {
  if (!state.roundId || state.mainDrawComplete) return;

  try {
    const numbers = parseDrawNumbers(elements.mainNumbers.value);
    const positions = parsePositions(elements.spreadPositions.value);

    if (positions.length > 0 && positions.length !== numbers.length) {
      throw new Error(`你定义了 ${positions.length} 个牌位，但输入了 ${numbers.length} 个数字。请调整后重试；本回合不会重新洗牌。`);
    }

    renderCards(elements.mainCardGrid, numbers, positions);
    commitDraw(numbers);
    state.mainDrawComplete = true;

    const spreadName = elements.spreadName.value.trim();
    elements.mainReadingHeading.textContent = spreadName || "本次牌阵";
    elements.mainReading.hidden = false;
    elements.clarificationSection.hidden = false;
    elements.drawButton.disabled = true;
    elements.mainNumbers.disabled = true;
    lockSpreadDefinition(true);
    setMessage(elements.mainMessage, `已翻开 ${numbers.length} 张牌。本回合牌序与方向保持不变。`, "success");
    elements.mainReading.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setMessage(elements.mainMessage, error.message || String(error));
  }
}

function drawClarification() {
  if (!state.roundId || !state.mainDrawComplete) return;

  try {
    const numbers = parseDrawNumbers(elements.clarificationNumbers.value);
    const label = elements.clarificationLabel.value.trim();
    state.clarificationCount += 1;

    const group = document.createElement("section");
    group.className = "clarification-group";

    const heading = document.createElement("h3");
    heading.textContent = label || `补充抽牌 ${state.clarificationCount}`;

    const meta = document.createElement("p");
    meta.className = "group-meta";
    meta.textContent = `Round ID · ${state.roundId} · 同一副牌，未重新洗牌`;

    const grid = document.createElement("div");
    grid.className = "card-grid";
    group.append(heading, meta, grid);
    elements.clarificationResults.append(group);

    renderCards(grid, numbers);
    commitDraw(numbers);
    elements.clarificationNumbers.value = "";
    elements.clarificationLabel.value = "";
    setMessage(elements.clarificationMessage, `已追加 ${numbers.length} 张补充牌。`, "success");
    group.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setMessage(elements.clarificationMessage, error.message || String(error));
  }
}

function updateDrawnHistory() {
  if (state.drawnNumbers.size === 0) {
    elements.drawnHistory.textContent = "本回合尚未使用任何数字。";
    return;
  }
  const used = Array.from(state.drawnNumbers).sort((a, b) => a - b).join(", ");
  elements.drawnHistory.innerHTML = `<strong>本回合已使用：</strong>${used}`;
}

function endRound() {
  if (!state.roundId) return;
  if (state.drawnNumbers.size > 0) {
    const confirmed = window.confirm("要结束当前回合吗？已翻开的牌与补充抽牌记录会被清除。");
    if (!confirmed) return;
  }

  state.roundId = null;
  state.deck = [];
  state.drawnNumbers = new Set();
  state.mainDrawComplete = false;
  state.clarificationCount = 0;

  elements.roundPill.classList.remove("is-active");
  elements.roundStatus.textContent = "尚未开始回合";
  elements.endRoundButton.hidden = true;
  elements.startRoundButton.textContent = "开始新回合";
  elements.drawPanel.hidden = true;
  elements.mainReading.hidden = true;
  elements.clarificationSection.hidden = true;
  elements.mainCardGrid.replaceChildren();
  elements.clarificationResults.replaceChildren();
  elements.spreadName.value = "";
  elements.spreadPositions.value = "";
  elements.mainNumbers.value = "";
  elements.mainNumbers.disabled = false;
  elements.clarificationNumbers.value = "";
  elements.clarificationLabel.value = "";
  elements.drawButton.disabled = false;
  lockSpreadDefinition(false);
  setMessage(elements.mainMessage, "");
  setMessage(elements.clarificationMessage, "");
  setRoundReferences();
  updateDrawnHistory();
  elements.spreadName.focus();
}

elements.startRoundButton.addEventListener("click", startRound);
elements.endRoundButton.addEventListener("click", endRound);
elements.drawButton.addEventListener("click", drawMainSpread);
elements.clarificationButton.addEventListener("click", drawClarification);

elements.mainNumbers.addEventListener("keydown", event => {
  if (event.key === "Enter") drawMainSpread();
});

elements.clarificationNumbers.addEventListener("keydown", event => {
  if (event.key === "Enter") drawClarification();
});

try {
  validateSourceData(TAROT_CARDS);
  state.dataReady = true;
  elements.dataNote.textContent = "78 张牌数据已就绪 · 完全离线";
  elements.dataNote.classList.add("is-ready");
} catch (error) {
  showDeveloperError(error);
}
