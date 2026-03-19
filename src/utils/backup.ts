import type { Category, Countdown } from 'types';

export interface BackupUserMeta {
  id: number;
  nickname: string;
}

export interface BackupPayload {
  version: '1.0.0';
  exportedAt: string;
  app: '奇妙日';
  user: BackupUserMeta;
  categories: Category[];
  countdowns: Countdown[];
}

export interface BackupValidationResult {
  valid: boolean;
  message: string;
}

export interface BackupImportSummary {
  categoriesCreated: number;
  categoriesReused: number;
  countdownsCreated: number;
  countdownsSkipped: number;
  countdownsFailed: number;
}

export interface NormalizedCountdownImportItem extends Omit<Countdown, 'category_id' | 'user_id'> {
  categoryName: string;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeColor(value: unknown): string {
  const color = normalizeText(value);
  return color || '#1890ff';
}

function normalizeIcon(value: unknown): string {
  const icon = normalizeText(value);
  return icon || '📁';
}

function buildCategoryKey(category: Pick<Category, 'name' | 'icon' | 'color'>): string {
  return `${normalizeText(category.name)}__${normalizeIcon(category.icon)}__${normalizeColor(category.color)}`;
}

function buildCountdownDuplicateKey(item: Pick<Countdown, 'title' | 'date' | 'time' | 'repeat_cycle' | 'repeat_frequency'>, categoryName: string): string {
  return [
    normalizeText(item.title),
    normalizeText(item.date),
    normalizeText(item.time || ''),
    String(item.repeat_cycle ?? 0),
    normalizeText(item.repeat_frequency),
    normalizeText(categoryName)
  ].join('__');
}

export function createBackupPayload(params: {
  user: BackupUserMeta;
  categories: Category[];
  countdowns: Countdown[];
}): BackupPayload {
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

export function stringifyBackupPayload(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function parseBackupPayload(raw: string): BackupPayload {
  return JSON.parse(raw) as BackupPayload;
}

export function validateBackupPayload(payload: any): BackupValidationResult {
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

export function normalizeBackupCategories(categories: Category[]): Array<Pick<Category, 'name' | 'icon' | 'color'>> {
  return categories
    .filter(category => normalizeText(category?.name) !== '')
    .map(category => ({
      name: normalizeText(category.name),
      icon: normalizeIcon(category.icon),
      color: normalizeColor(category.color)
    }));
}

export function normalizeBackupCountdowns(params: {
  countdowns: Countdown[];
  categories: Category[];
}): NormalizedCountdownImportItem[] {
  const categoryNameMap = new Map<number, string>();
  params.categories.forEach(category => {
    if (category?.id != null) {
      categoryNameMap.set(category.id, normalizeText(category.name));
    }
  });

  return params.countdowns
    .filter(item => normalizeText(item?.title) !== '' && normalizeText(item?.date) !== '')
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

export function buildExistingCategoryMaps(categories: Category[]): {
  byKey: Map<string, Category>;
  byName: Map<string, Category>;
} {
  const byKey = new Map<string, Category>();
  const byName = new Map<string, Category>();

  categories.forEach(category => {
    byKey.set(buildCategoryKey(category), category);
    byName.set(normalizeText(category.name), category);
  });

  return { byKey, byName };
}

export function buildExistingCountdownKeySet(params: {
  countdowns: Countdown[];
  categories: Category[];
}): Set<string> {
  const categoryNameMap = new Map<number, string>();
  params.categories.forEach(category => {
    if (category.id != null) {
      categoryNameMap.set(category.id, normalizeText(category.name));
    }
  });

  const result = new Set<string>();
  params.countdowns.forEach(item => {
    const categoryName = categoryNameMap.get(item.category_id) || '';
    if (!categoryName) {
      return;
    }
    result.add(buildCountdownDuplicateKey(item, categoryName));
  });
  return result;
}

export function getCategoryDuplicateKey(category: Pick<Category, 'name' | 'icon' | 'color'>): string {
  return buildCategoryKey(category);
}

export function getCountdownDuplicateKey(item: Pick<Countdown, 'title' | 'date' | 'time' | 'repeat_cycle' | 'repeat_frequency'>, categoryName: string): string {
  return buildCountdownDuplicateKey(item, categoryName);
}
