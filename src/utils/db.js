// SQLite数据库管理工具 - 基于内存字典存储
// 由于uniapp环境限制，使用内存存储模拟数据库操作

class Database {
  constructor() {
    this.data = {
      users: [],
      categories: [],
      countdowns: []
    };
    this.autoIncrementIds = {
      users: 1,
      categories: 1,
      countdowns: 1
    };
    this.init();
  }

  // 初始化数据库
  init() {
    try {
      const savedData = uni.getStorageSync('countdown_db');
      if (savedData) {
        this.data = JSON.parse(savedData);
        this.autoIncrementIds = {
          users: Math.max(...this.data.users.map(u => u.id), 0) + 1,
          categories: Math.max(...this.data.categories.map(c => c.id), 0) + 1,
          countdowns: Math.max(...this.data.countdowns.map(c => c.id), 0) + 1
        };
        this.migrateData();
      } else {
        this.initDefaultData();
      }
    } catch (e) {
      this.initDefaultData();
    }
  }

  // 数据迁移：为现有数据添加新字段
  migrateData() {
    let needSave = false;
    const now = new Date().toISOString();
    
    this.data.countdowns.forEach(countdown => {
      if (countdown.isPinned === undefined) {
        countdown.isPinned = false;
        needSave = true;
      }
      if (countdown.repeatCycle === undefined) {
        countdown.repeatCycle = 0;
        needSave = true;
      }
      if (countdown.repeatFrequency === undefined) {
        countdown.repeatFrequency = '不重复';
        needSave = true;
      }
      if (countdown.isArchived === undefined) {
        countdown.isArchived = false;
        needSave = true;
      }
      // 添加更新时间字段
      if (countdown.updatedAt === undefined) {
        countdown.updatedAt = countdown.createdAt || now;
        needSave = true;
      }
    });
    
    if (needSave) {
      this.save();
    }
  }

  // 初始化默认数据
  initDefaultData() {
    const now = new Date().toISOString();
    const defaultUser = {
      id: 1,
      nickname: '张三',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'
    };
    this.data.users.push(defaultUser);
    this.autoIncrementIds.users = 2;

    const defaultCategories = [
      { id: 1, name: '生活', icon: '🏠', color: '#1890ff', userId: 1 },
      { id: 2, name: '工作', icon: '💼', color: '#52c41a', userId: 1 },
      { id: 3, name: '家人', icon: '👨‍👩‍👧', color: '#faad14', userId: 1 },
      { id: 4, name: '里程碑', icon: '🎯', color: '#f5222d', userId: 1 }
    ];
    this.data.categories = defaultCategories;
    this.autoIncrementIds.categories = 5;

    const sampleCountdowns = [
      {
        id: 1,
        title: '春节',
        date: '2025-01-29',
        categoryId: 1,
        userId: 1,
        isPinned: false,
        repeatCycle: 0,
        repeatFrequency: '不重复',
        isArchived: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        title: '项目截止日',
        date: '2025-12-31',
        categoryId: 2,
        userId: 1,
        isPinned: false,
        repeatCycle: 0,
        repeatFrequency: '不重复',
        isArchived: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 3,
        title: '妈妈生日',
        date: '2025-06-15',
        categoryId: 3,
        userId: 1,
        isPinned: false,
        repeatCycle: 0,
        repeatFrequency: '不重复',
        isArchived: false,
        createdAt: now,
        updatedAt: now
      }
    ];
    this.data.countdowns = sampleCountdowns;
    this.autoIncrementIds.countdowns = 4;

    this.save();
  }

  // 保存数据到本地存储
  save() {
    try {
      uni.setStorageSync('countdown_db', JSON.stringify(this.data));
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }

  // 用户相关操作
  getUser(id) {
    return this.data.users.find(u => u.id === id);
  }

  getCurrentUser() {
    return this.data.users[0] || null;
  }

  updateUser(id, updates) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.data.users[index] = { ...this.data.users[index], ...updates };
      this.save();
      return this.data.users[index];
    }
    return null;
  }

  // 分类相关操作
  getCategories(userId) {
    return this.data.categories.filter(c => c.userId === userId);
  }

  getCategory(id) {
    return this.data.categories.find(c => c.id === id);
  }

  addCategory(category) {
    const newCategory = {
      id: this.autoIncrementIds.categories++,
      ...category,
      createdAt: new Date().toISOString()
    };
    this.data.categories.push(newCategory);
    this.save();
    return newCategory;
  }

  updateCategory(id, updates) {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.categories[index] = { ...this.data.categories[index], ...updates };
      this.save();
      return this.data.categories[index];
    }
    return null;
  }

  deleteCategory(id) {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.categories.splice(index, 1);
      this.data.countdowns = this.data.countdowns.filter(cd => cd.categoryId !== id);
      this.save();
      return true;
    }
    return false;
  }

  // 倒数日相关操作
  getCountdowns(userId, categoryId = null, includeArchived = false) {
    let countdowns = this.data.countdowns.filter(cd => cd.userId === userId);
    
    if (!includeArchived) {
      countdowns = countdowns.filter(cd => !cd.isArchived);
    }
    
    if (categoryId) {
      countdowns = countdowns.filter(cd => cd.categoryId === categoryId);
    }
    
    // 排序：置顶的在前，非置顶的在后；置顶的按更新时间降序排列
    return countdowns.sort((a, b) => {
      // 如果都是置顶的，按更新时间降序
      if (a.isPinned && b.isPinned) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      // 如果a是置顶的，b不是，a在前
      if (a.isPinned && !b.isPinned) {
        return -1;
      }
      // 如果b是置顶的，a不是，b在前
      if (!a.isPinned && b.isPinned) {
        return 1;
      }
      // 都不是置顶的，按日期升序排列
      return new Date(a.date) - new Date(b.date);
    });
  }

  getArchivedCountdowns(userId) {
    return this.data.countdowns.filter(cd => cd.userId === userId && cd.isArchived);
  }

  getCountdown(id) {
    return this.data.countdowns.find(cd => cd.id === id);
  }

  addCountdown(countdown) {
    const now = new Date().toISOString();
    const newCountdown = {
      id: this.autoIncrementIds.countdowns++,
      isPinned: false,
      repeatCycle: 0,
      repeatFrequency: '不重复',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      ...countdown
    };
    this.data.countdowns.push(newCountdown);
    this.save();
    return newCountdown;
  }

  updateCountdown(id, updates) {
    const index = this.data.countdowns.findIndex(cd => cd.id === id);
    if (index !== -1) {
      this.data.countdowns[index] = { 
        ...this.data.countdowns[index], 
        ...updates,
        updatedAt: new Date().toISOString() // 更新时间
      };
      this.save();
      return this.data.countdowns[index];
    }
    return null;
  }

  deleteCountdown(id) {
    const index = this.data.countdowns.findIndex(cd => cd.id === id);
    if (index !== -1) {
      this.data.countdowns.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  archiveCountdown(id) {
    const index = this.data.countdowns.findIndex(cd => cd.id === id);
    if (index !== -1) {
      this.data.countdowns[index].isArchived = true;
      this.data.countdowns[index].updatedAt = new Date().toISOString();
      this.save();
      return this.data.countdowns[index];
    }
    return null;
  }

  unarchiveCountdown(id) {
    const index = this.data.countdowns.findIndex(cd => cd.id === id);
    if (index !== -1) {
      this.data.countdowns[index].isArchived = false;
      this.data.countdowns[index].updatedAt = new Date().toISOString();
      this.save();
      return this.data.countdowns[index];
    }
    return null;
  }

  togglePin(id) {
    const index = this.data.countdowns.findIndex(cd => cd.id === id);
    if (index !== -1) {
      this.data.countdowns[index].isPinned = !this.data.countdowns[index].isPinned;
      this.data.countdowns[index].updatedAt = new Date().toISOString();
      this.save();
      return this.data.countdowns[index];
    }
    return null;
  }

  // 获取指定日期的倒数日
  getCountdownsByDate(userId, date) {
    return this.data.countdowns.filter(cd => cd.userId === userId && cd.date === date && !cd.isArchived);
  }

  // 计算天数差
  calculateDays(targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // 获取重复日程的未来最近日期
  getNextRepeatDate(originalDate, repeatCycle, repeatFrequency) {
    // 如果不是重复日程，返回原日期
    if (repeatCycle === 0 || repeatFrequency === '不重复') {
      return originalDate;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let nextDate = new Date(originalDate);
    nextDate.setHours(0, 0, 0, 0);

    // 如果起始日期在未来，直接返回
    if (nextDate > today) {
      return originalDate;
    }

    // 循环计算下一个未来日期
    while (nextDate <= today) {
      switch (repeatFrequency) {
        case '天重复':
          nextDate.setDate(nextDate.getDate() + repeatCycle);
          break;
        case '周重复':
          nextDate.setDate(nextDate.getDate() + repeatCycle * 7);
          break;
        case '月重复':
          nextDate.setMonth(nextDate.getMonth() + repeatCycle);
          break;
        case '年重复':
          nextDate.setFullYear(nextDate.getFullYear() + repeatCycle);
          break;
      }
    }

    // 格式化为 YYYY-MM-DD
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 获取倒数日的显示日期（考虑重复日程）
  getCountdownDisplayDate(countdown) {
    if (countdown.repeatCycle > 0 && countdown.repeatFrequency !== '不重复') {
      return this.getNextRepeatDate(countdown.date, countdown.repeatCycle, countdown.repeatFrequency);
    }
    return countdown.date;
  }

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[date.getDay()];
    return `${year}年${month}月${day}日 星期${weekDay}`;
  }

  // 获取重复选项文本
  getRepeatText(repeatCycle, repeatFrequency) {
    if (repeatCycle === 0 || repeatFrequency === '不重复') {
      return '不重复';
    }
    return `每${repeatCycle}${repeatFrequency}`;
  }

  // 清空所有数据
  clearAll() {
    this.data = {
      users: [],
      categories: [],
      countdowns: []
    };
    this.autoIncrementIds = {
      users: 1,
      categories: 1,
      countdowns: 1
    };
    this.save();
  }
}

const db = new Database();

export default db;