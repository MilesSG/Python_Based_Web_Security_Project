import { Stats, User, Comment, Log, Vulnerability } from '../types';

// 模拟统计数据
export const mockStats: Stats = {
  vulnerability_types: [
    { name: 'SQL注入', count: 12, risk_score: 8.5 },
    { name: 'XSS攻击', count: 18, risk_score: 7.2 },
    { name: '文件上传漏洞', count: 6, risk_score: 6.8 },
    { name: '不安全直接对象引用', count: 9, risk_score: 5.5 },
    { name: '其他漏洞', count: 4, risk_score: 4.0 }
  ],
  monthly_attacks: [
    { month: '1月', attacks: 32 },
    { month: '2月', attacks: 45 },
    { month: '3月', attacks: 29 },
    { month: '4月', attacks: 56 },
    { month: '5月', attacks: 48 },
    { month: '6月', attacks: 62 }
  ],
  response_time: [
    { state: '正常', time: 250 },
    { state: '攻击中', time: 620 },
    { state: '防护后', time: 310 }
  ],
  security_score: [
    { category: '输入验证', before: 3.5, after: 8.2 },
    { category: '身份认证', before: 4.2, after: 9.0 },
    { category: '授权控制', before: 5.0, after: 8.5 },
    { category: '安全配置', before: 3.8, after: 7.8 }
  ]
};

// 模拟用户数据
export const mockUsers: User[] = [
  { id: 1, username: 'admin', email: 'admin@example.com', created_at: '2023-01-15' },
  { id: 2, username: 'user1', email: 'user1@example.com', created_at: '2023-02-20' },
  { id: 3, username: 'user2', email: 'user2@example.com', created_at: '2023-03-10' },
  { id: 4, username: 'secure_user', email: 'secure@example.com', created_at: '2023-03-22' }
];

// 模拟评论数据
export const mockComments: Comment[] = [
  { comment: '这是一条普通评论', timestamp: '2023-05-18 14:30:12' },
  { comment: '<script>alert("XSS攻击示例");</script>', timestamp: '2023-05-18 15:42:36' },
  { comment: '另一条安全的评论', timestamp: '2023-05-19 09:15:50' }
];

// 模拟日志数据
export const mockLogs: Log[] = [
  { id: 1, vulnerability_type: 'SQL注入', details: '检测到SQL注入尝试，参数: username=admin\'--', severity: '高', timestamp: '2023-05-20 10:15:22' },
  { id: 2, vulnerability_type: 'XSS攻击', details: '存储型XSS攻击尝试在评论区', severity: '中', timestamp: '2023-05-20 11:32:47' },
  { id: 3, vulnerability_type: '文件上传', details: '尝试上传PHP脚本文件', severity: '高', timestamp: '2023-05-20 13:45:12' },
  { id: 4, vulnerability_type: '不安全引用', details: '尝试访问用户ID 3的数据', severity: '中', timestamp: '2023-05-20 14:30:56' }
];

// 模拟漏洞数据
export const mockVulnerabilities: Vulnerability[] = [
  { id: 1, name: 'SQL注入漏洞', severity: 'high', location: '/api/users?username=', status: 'open', description: '用户搜索接口未对输入进行净化', remediation: '使用参数化查询', detectedDate: '2023-05-15' },
  { id: 2, name: 'XSS存储型漏洞', severity: 'medium', location: '/comments.php', status: 'in_progress', description: '评论未经过滤直接存储和显示', remediation: '实施内容安全策略(CSP)和输入净化', detectedDate: '2023-05-16' },
  { id: 3, name: '不安全文件上传', severity: 'critical', location: '/upload.php', status: 'fixed', description: '允许上传任意类型文件并直接访问', remediation: '限制文件类型、使用随机文件名、处理文件权限', detectedDate: '2023-05-17' }
]; 