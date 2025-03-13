import axios from 'axios';
import { mockStats, mockUsers, mockComments, mockLogs, mockVulnerabilities } from './mockData';

const BASE_URL = 'http://localhost:5000';

// 是否使用模拟数据（当后端不可用时设置为true）
const USE_MOCK_DATA = true;

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API服务
export const apiService = {
  // 获取用户信息（SQL注入演示）
  getUserByUsername: (username: string) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const filteredUsers = mockUsers.filter(user => 
            user.username.includes(username)
          );
          resolve({ data: filteredUsers });
        }, 300);
      });
    }
    return api.get(`/api/users?username=${username}`);
  },

  // 安全版本获取用户信息
  getUserByUsernameSecure: (username: string) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const filteredUsers = mockUsers.filter(user => 
            user.username === username
          );
          resolve({ data: filteredUsers });
        }, 300);
      });
    }
    return api.get(`/api/secure/users?username=${username}`);
  },

  // 获取评论（XSS演示）
  getComments: () => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: mockComments });
        }, 300);
      });
    }
    return api.get('/api/comments');
  },

  // 添加评论（XSS演示）
  addComment: (comment: string) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newComment = {
            comment,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
          };
          mockComments.unshift(newComment);
          resolve({ data: { success: true, comment: newComment } });
        }, 300);
      });
    }
    return api.post('/api/comments', { comment });
  },

  // 文件上传（文件上传漏洞演示）
  uploadFile: (file: File) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const isVulnerable = file.name.endsWith('.php') || file.name.endsWith('.exe');
          resolve({ 
            data: { 
              success: true, 
              filename: file.name,
              path: `/uploads/${file.name}`,
              vulnerable: isVulnerable ? '检测到潜在危险文件!' : null
            } 
          });
        }, 500);
      });
    }
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 获取用户数据（不安全直接对象引用演示）
  getUserData: (userId: number) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const user = mockUsers.find(u => u.id === userId);
          if (user) {
            resolve({ data: user });
          } else {
            reject({ response: { status: 404, data: { message: '用户不存在' } } });
          }
        }, 300);
      });
    }
    return api.get(`/api/user_data/${userId}`);
  },

  // 获取日志
  getLogs: () => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: mockLogs });
        }, 300);
      });
    }
    return api.get('/api/logs');
  },

  // 获取统计数据
  getStats: () => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: mockStats });
        }, 500);
      });
    }
    return api.get('/api/stats');
  },

  // 获取漏洞列表
  getVulnerabilities: () => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: mockVulnerabilities });
        }, 300);
      });
    }
    return api.get('/api/vulnerabilities');
  },
};

export default apiService; 