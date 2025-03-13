import { useState, useEffect } from 'react';

// 主题配置
export const defaultTheme = {
  colorPrimary: '#1677ff',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#ff4d4f',
  colorInfo: '#1677ff',
  borderRadius: 6,
  wireframe: false,
};

// 主题切换服务
export function useThemeMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // 初始化时从本地存储读取主题模式
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) {
      setIsDarkMode(savedMode === 'dark');
    } else {
      // 根据系统偏好设置初始主题
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDarkMode);
    }
  }, []);
  
  // 切换主题模式
  const toggleThemeMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('themeMode', newMode ? 'dark' : 'light');
  };
  
  return { isDarkMode, toggleThemeMode };
}

// 获取当前主题配置
export function getThemeConfig(isDarkMode: boolean) {
  return {
    token: {
      ...defaultTheme,
      // 在暗色模式下调整一些颜色
      ...(isDarkMode ? {
        colorBgContainer: '#141414',
        colorBgElevated: '#1f1f1f',
        colorText: 'rgba(255, 255, 255, 0.85)',
        colorTextSecondary: 'rgba(255, 255, 255, 0.45)',
      } : {}),
    },
    algorithm: isDarkMode ? 'darkAlgorithm' : 'defaultAlgorithm',
  };
} 