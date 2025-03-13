import { message } from 'antd';
import axios, { AxiosError } from 'axios';

// 错误类型接口
export interface ApiError {
  status: number;
  message: string;
  details?: string;
  path?: string;
}

// 处理API错误
export function handleApiError(error: unknown): ApiError {
  // Axios错误
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // 服务器返回的错误信息
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      
      // 根据状态码处理不同类型的错误
      switch (status) {
        case 400: // 错误请求
          return {
            status,
            message: '请求参数错误',
            details: data?.message || axiosError.message,
            path: axiosError.config?.url,
          };
        
        case 401: // 未授权
          return {
            status,
            message: '未授权，请登录',
            details: data?.message || axiosError.message,
            path: axiosError.config?.url,
          };
        
        case 403: // 禁止访问
          return {
            status,
            message: '无权限访问此资源',
            details: data?.message || axiosError.message,
            path: axiosError.config?.url,
          };
        
        case 404: // 资源不存在
          return {
            status,
            message: '请求的资源不存在',
            details: data?.message || axiosError.message,
            path: axiosError.config?.url,
          };
        
        case 500: // 服务器错误
        case 502: // 网关错误
        case 503: // 服务不可用
        case 504: // 网关超时
          return {
            status,
            message: '服务器错误',
            details: data?.message || axiosError.message,
            path: axiosError.config?.url,
          };
        
        default:
          return {
            status,
            message: `请求错误 (${status})`,
            details: data?.message || axiosError.message,
            path: axiosError.config?.url,
          };
      }
    }
    
    // 请求没有发送成功（网络错误等）
    return {
      status: 0,
      message: '网络错误，无法连接到服务器',
      details: axiosError.message,
    };
  }
  
  // 非Axios错误
  if (error instanceof Error) {
    return {
      status: 0,
      message: '应用错误',
      details: error.message,
    };
  }
  
  // 未知错误
  return {
    status: 0,
    message: '未知错误',
    details: String(error),
  };
}

// 显示错误消息
export function showErrorMessage(error: unknown): void {
  const apiError = handleApiError(error);
  
  message.error(apiError.message);
  
  // 记录错误以便调试
  console.error('[API Error]', apiError);
}

// 尝试执行异步操作并处理错误
export async function tryCatch<T>(
  asyncFn: () => Promise<T>,
  options: {
    showError?: boolean;
    errorMessage?: string;
  } = { showError: true }
): Promise<T | null> {
  try {
    return await asyncFn();
  } catch (error) {
    if (options.showError) {
      if (options.errorMessage) {
        message.error(options.errorMessage);
      } else {
        showErrorMessage(error);
      }
    }
    
    return null;
  }
} 