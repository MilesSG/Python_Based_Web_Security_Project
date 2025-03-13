// 用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

// 评论类型
export interface Comment {
  comment: string;
  timestamp: string;
}

// 日志类型
export interface Log {
  id: number;
  vulnerability_type: string;
  details: string;
  severity: string;
  timestamp: string;
}

// 文件上传响应类型
export interface UploadResponse {
  success: boolean;
  path: string;
  is_dangerous: boolean;
  filename: string;
}

// 漏洞类型统计
export interface VulnerabilityType {
  name: string;
  count: number;
  risk_score: number;
}

// 月度攻击统计
export interface MonthlyAttack {
  month: string;
  attacks: number;
}

// 响应时间统计
export interface ResponseTime {
  state: string;
  time: number;
}

// 安全评分
export interface SecurityScore {
  category: string;
  before: number;
  after: number;
}

// 统计数据类型
export interface Stats {
  vulnerability_types: VulnerabilityType[];
  monthly_attacks: MonthlyAttack[];
  response_time: ResponseTime[];
  security_score: SecurityScore[];
}

// 攻击模拟结果类型
export interface AttackResult {
  success: boolean;
  message: string;
  details?: string;
  response_time?: number;
}

// 漏洞类型定义
export interface Vulnerability {
  id: number;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  status: 'open' | 'fixed' | 'in_progress';
  description?: string;
  remediation?: string;
  detectedDate?: string;
}

// 扫描结果类型定义
export interface ScanResult {
  id: number;
  scanDate: string;
  targetUrl: string;
  status: 'completed' | 'in_progress' | 'failed';
  vulnerabilities: Vulnerability[];
  summary: {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
} 