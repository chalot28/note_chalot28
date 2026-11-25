interface TagKeywordRule {
  tag: string;
  keywords: readonly string[];
}

const TAG_RULES: readonly TagKeywordRule[] = [
  {
    tag: 'công-việc',
    keywords: ['họp', 'meeting', 'deadline', 'dự án', 'project', 'báo cáo', 'kpi', 'sprint', 'task'],
  },
  {
    tag: 'tài-chính',
    keywords: ['chi tiêu', 'ngân sách', 'vnd', 'usd', 'hóa đơn', 'lương', 'đầu tư', 'tiết kiệm', 'thuế'],
  },
  {
    tag: 'ý-tưởng',
    keywords: ['ý tưởng', 'idea', 'brainstorm', 'concept', 'thiết kế', 'sáng tạo', 'khởi nghiệp'],
  },
  {
    tag: 'học-tập',
    keywords: ['học', 'sách', 'khóa học', 'nghiên cứu', 'tóm tắt', 'bài giảng', 'kiến thức'],
  },
  {
    tag: 'khẩn-cấp',
    keywords: ['gấp', 'khẩn', 'urgent', 'ngay hôm nay', 'asap', 'quan trọng', 'ưu tiên'],
  },
  {
    tag: 'cá-nhân',
    keywords: ['sức khỏe', 'tập gym', 'gia đình', 'du lịch', 'nhật ký', 'mua sắm', 'cuối tuần'],
  },
];

const HASHTAG_REGEX = /(?:^|\s)#([\p{L}\p{N}_-]{2,32})/gu;

export function extractHashtags(plainText: string): string[] {
  const found = new Set<string>();
  let match = HASHTAG_REGEX.exec(plainText);
  while (match !== null) {
    const tag = match[1]?.toLowerCase();
    if (tag) found.add(tag);
    match = HASHTAG_REGEX.exec(plainText);
  }
  HASHTAG_REGEX.lastIndex = 0;
  return Array.from(found);
}

export function suggestTagsFromContent(plainText: string, existingTags: readonly string[], limit = 4): string[] {
  const lower = plainText.toLowerCase();
  const existingSet = new Set(existingTags.map((t) => t.toLowerCase()));
  const scored: Array<{ tag: string; hits: number }> = [];

  for (const rule of TAG_RULES) {
    if (existingSet.has(rule.tag)) continue;
    let hits = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) hits += 1;
    }
    if (hits > 0) scored.push({ tag: rule.tag, hits });
  }

  scored.sort((a, b) => b.hits - a.hits);
  return scored.slice(0, limit).map((item) => item.tag);
}
