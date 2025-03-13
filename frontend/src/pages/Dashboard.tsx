import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Alert, List, Typography, Button, Space, Divider, Tag } from 'antd';
import { Link } from 'react-router-dom';
import ReactEcharts from 'echarts-for-react';
import {
  SafetyOutlined,
  BugOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FileProtectOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import apiService from '../api/api';
import { Stats } from '../types';

const { Title, Paragraph, Text } = Typography;

// 仪表盘页面
const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await apiService.getStats();
        setStats((result as any).data as Stats);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 计算风险评分
  const calculateRiskScore = () => {
    if (!stats) return 0;
    
    const totalVulnerabilities = stats.vulnerability_types.reduce((sum, item) => sum + item.count, 0);
    const weightedScore = stats.vulnerability_types.reduce((sum, item) => sum + (item.count * item.risk_score), 0);
    
    return totalVulnerabilities > 0 ? Math.round((weightedScore / totalVulnerabilities) * 10) / 10 : 0;
  };

  // 威胁分布图表
  const getThreatDistributionOption = () => {
    if (!stats) return {};
    
    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        top: '5%',
        left: 'center'
      },
      series: [
        {
          name: '威胁分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: stats.vulnerability_types.map(item => ({
            value: item.count,
            name: item.name
          })),
          color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#7B68EE']
        }
      ]
    };
  };

  // 响应时间图表
  const getResponseTimeOption = () => {
    if (!stats) return {};
    
    return {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}ms'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: stats.response_time.map(item => item.state),
        axisLabel: {
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '响应时间(ms)'
      },
      series: [
        {
          name: '响应时间',
          type: 'line',
          data: stats.response_time.map(item => item.time),
          smooth: true,
          lineStyle: {
            width: 4
          },
          itemStyle: {
            color: function(params: any) {
              const colorList = ['#91cc75', '#ee6666', '#5470c6'];
              return colorList[params.dataIndex];
            }
          },
          markPoint: {
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' }
            ]
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(80, 141, 255, 0.3)'
              }, {
                offset: 1, color: 'rgba(80, 141, 255, 0.1)'
              }]
            }
          }
        }
      ]
    };
  };

  // 常见安全漏洞列表
  const commonVulnerabilities = [
    { 
      title: 'SQL注入', 
      description: '通过在输入字段中插入恶意SQL代码来操纵数据库',
      risk: '高',
      path: '/sql-injection'
    },
    { 
      title: 'XSS攻击', 
      description: '跨站脚本攻击，在网页中注入恶意脚本',
      risk: '高',
      path: '/xss'
    },
    { 
      title: '不安全文件上传', 
      description: '上传恶意文件或脚本到服务器',
      risk: '中',
      path: '/file-upload'
    },
    { 
      title: '不安全直接对象引用', 
      description: '直接访问未经授权的资源',
      risk: '中',
      path: '/insecure-reference'
    }
  ];

  return (
    <div className="dashboard-page">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2}>
          <SafetyOutlined /> Web应用漏洞扫描与防护平台
        </Title>
        <Paragraph>
          一站式可视化平台，用于演示、检测和防护Web应用中的常见安全漏洞
        </Paragraph>
      </div>

      <Alert
        message="系统状态"
        description="本平台仅用于教学和研究目的，展示了常见的Web应用漏洞及其防护技术。请勿将演示的漏洞代码用于生产环境或非法活动。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="dashboard-card">
            <Statistic
              title="安全风险评分"
              value={calculateRiskScore()}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
              suffix="/10"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="dashboard-card">
            <Statistic
              title="检测到的漏洞"
              value={stats ? stats.vulnerability_types.reduce((sum, item) => sum + item.count, 0) : 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="dashboard-card">
            <Statistic
              title="已修复漏洞"
              value={stats ? Math.floor(stats.vulnerability_types.reduce((sum, item) => sum + item.count, 0) * 0.6) : 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="dashboard-card">
            <Statistic
              title="防护措施"
              value="5"
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileProtectOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Divider>数据分析</Divider>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title="威胁分布" 
            bordered={false}
            className="chart-card"
            extra={<Link to="/statistics">详情</Link>}
          >
            <ReactEcharts option={getThreatDistributionOption()} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="系统响应时间对比" 
            bordered={false}
            className="chart-card"
            extra={<Link to="/statistics">详情</Link>}
          >
            <ReactEcharts option={getResponseTimeOption()} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Divider>漏洞演示</Divider>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title={<><BugOutlined /> 常见安全漏洞</>} 
            bordered={false}
            className="list-card"
          >
            <List
              itemLayout="horizontal"
              dataSource={commonVulnerabilities}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Link to={item.path}>
                      <Button type="primary" size="small">演示</Button>
                    </Link>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<WarningOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />}
                    title={<Space>{item.title} <Tag color={item.risk === '高' ? 'error' : 'warning'}>{item.risk}风险</Tag></Space>}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<><ThunderboltOutlined /> 快速操作</>} 
            bordered={false}
            className="action-card"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Button type="primary" size="large" block>
                <Link to="/statistics">查看完整统计报告</Link>
              </Button>
              <Button type="default" size="large" block>
                <Link to="/protection">查看防护措施</Link>
              </Button>
              <Button type="default" size="large" block>
                <Link to="/3d-demo">查看3D安全可视化</Link>
              </Button>
              <div style={{ marginTop: 16 }}>
                <Alert
                  message="需要帮助？"
                  description={
                    <Text>
                      <QuestionCircleOutlined /> 如果您对Web安全有任何疑问，请参考我们的
                      <a href="#" style={{ marginLeft: 5 }}>文档</a>或
                      <a href="#" style={{ marginLeft: 5 }}>联系我们</a>。
                    </Text>
                  }
                  type="info"
                  showIcon={false}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 