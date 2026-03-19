function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeColor(value) {
  const color = normalizeText(value);
  return color || '#1890ff';
}

function normalizeIcon(value) {
  const icon = normalizeText(value);
  return icon || '📁';
}

function buildCategoryKey(category) {
  return `${normalizeText(category.name)}__${normalizeIcon(category.icon)}__${normalizeColor(category.color)}`;
}

function buildCountdownDuplicateKey(item, categoryName) {
  return [
    normalizeText(item.title),
    normalizeText(item.date),
    normalizeText(item.time || ''),
    String(item.repeat_cycle ?? 0),
    normalizeText(item.repeat_frequency),
    normalizeText(categoryName)
  ].join('__');
}

export function createBackupPayload(params) {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    app: '奇妙日',
    user: {
      id: params.user.id,
      nickname: params.user.nickname
    },
    categories: params.categories,
    countdowns: params.countdowns
  };
}

export function stringifyBackupPayload(payload) {
  return JSON.stringify(payload, null, 2);
}

export function parseBackupPayload(raw) {
  return JSON.parse(raw);
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: '备份内容不是有效对象' };
  }

  if (!Array.isArray(payload.categories)) {
    return { valid: false, message: '备份中缺少分类数据' };
  }

  if (!Array.isArray(payload.countdowns)) {
    return { valid: false, message: '备份中缺少倒数日数据' };
  }

  if (!payload.version) {
    return { valid: false, message: '备份版本缺失，无法导入' };
  }

  return { valid: true, message: 'ok' };
}

export function normalizeBackupCategories(categories) {
  return categories
    .filter(category => normalizeText(category == null ? void 0 : category.name) !== '')
    .map(category => ({
      name: normalizeText(category.name),
      icon: normalizeIcon(category.icon),
      color: normalizeColor(category.color)
    }));
}

export function normalizeBackupCountdowns(params) {
  const categoryNameMap = new Map();
  params.categories.forEach(category => {
    if (category != null && category.id != null) {
      categoryNameMap.set(category.id, normalizeText(category.name));
    }
  });

  return params.countdowns
    .filter(item => normalizeText(item == null ? void 0 : item.title) !== '' && normalizeText(item == null ? void 0 : item.date) !== '')
    .map(item => ({
      title: normalizeText(item.title),
      date: normalizeText(item.date),
      time: normalizeText(item.time || ''),
      is_pinned: !!item.is_pinned,
      repeat_cycle: item.repeat_cycle ?? 0,
      repeat_frequency: item.repeat_frequency ?? '不重复',
      is_archived: !!item.is_archived,
      created_at: item.created_at,
      updated_at: item.updated_at,
      days_left: item.days_left,
      status_text: item.status_text,
      repeat_text: item.repeat_text,
      id: item.id,
      categoryName: categoryNameMap.get(item.category_id) || ''
    }))
    .filter(item => item.categoryName !== '');
}

export function buildExistingCategoryMaps(categories) {
  const byKey = new Map();
  const byName = new Map();

  categories.forEach(category => {
    byKey.set(buildCategoryKey(category), category);
    byName.set(normalizeText(category.name), category);
  });

  return { byKey, byName };
}

export function buildExistingCountdownKeySet(params) {
  const categoryNameMap = new Map();
  params.categories.forEach(category => {
    if (category.id != null) {
      categoryNameMap.set(category.id, normalizeText(category.name));
    }
  });

  const result = new Set();
  params.countdowns.forEach(item => {
    const categoryName = categoryNameMap.get(item.category_id) || '';
    if (!categoryName) {
      return;
    }
    result.add(buildCountdownDuplicateKey(item, categoryName));
  });
  return result;
}

export function getCategoryDuplicateKey(category) {
  return buildCategoryKey(category);
}

export function getCountdownDuplicateKey(item, categoryName) {
  return buildCountdownDuplicateKey(item, categoryName);
}
