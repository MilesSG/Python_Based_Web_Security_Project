import { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Alert, Typography, Divider } from 'antd';
import { LineChartOutlined, BarChartOutlined, PieChartOutlined, RiseOutlined } from '@ant-design/icons';
import ReactEcharts from 'echarts-for-react';
import * as echarts from 'echarts';
import apiService from '../api/api';
import { Stats } from '../types';

const { Title, Paragraph } = Typography;

// 统计分析页面
const Statistics = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await apiService.getStats();
        setStats((result as any).data as Stats);
        setError(null);
      } catch (err) {
        console.error('获取统计数据失败:', err);
        setError('获取统计数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 漏洞类型分布图表配置
  const getVulnerabilityTypeOption = () => {
    if (!stats) return {};

    return {
      title: {
        text: '漏洞类型分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: stats.vulnerability_types.map(item => item.name)
      },
      series: [
        {
          name: '漏洞数量',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
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
              fontSize: 20,
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

  // 月度攻击趋势图表配置
  const getMonthlyAttacksOption = () => {
    if (!stats) return {};

    return {
      title: {
        text: '月度攻击趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: stats.monthly_attacks.map(item => item.month),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '攻击次数'
      },
      series: [
        {
          name: '攻击次数',
          type: 'bar',
          data: stats.monthly_attacks.map(item => item.attacks),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#2378f7' },
                { offset: 0.7, color: '#2378f7' },
                { offset: 1, color: '#83bff6' }
              ])
            }
          }
        }
      ]
    };
  };

  // 响应时间对比图表配置
  const getResponseTimeOption = () => {
    if (!stats) return {};

    return {
      title: {
        text: '系统响应时间对比',
        left: 'center',
        textStyle: {
          fontSize: 16,
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: stats.response_time.map(item => item.state)
      },
      yAxis: {
        type: 'value',
        name: '响应时间(ms)'
      },
      series: [
        {
          name: '响应时间',
          type: 'bar',
          data: stats.response_time.map(item => item.time),
          itemStyle: {
            color: function(params: any) {
              const colorList = ['#91cc75', '#ee6666', '#5470c6'];
              return colorList[params.dataIndex];
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c} ms'
          }
        }
      ]
    };
  };

  // 安全评分改进图表配置
  const getSecurityScoreOption = () => {
    if (!stats) return {};

    return {
      title: {
        text: '安全评分改进',
        left: 'center',
        textStyle: {
          fontSize: 16,
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['修复前', '修复后'],
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '评分',
        max: 100
      },
      yAxis: {
        type: 'category',
        data: stats.security_score.map(item => item.category),
        axisLabel: {
          interval: 0
        }
      },
      series: [
        {
          name: '修复前',
          type: 'bar',
          stack: '总量',
          label: {
            show: true,
            position: 'inside'
          },
          emphasis: {
            focus: 'series'
          },
          data: stats.security_score.map(item => item.before),
          itemStyle: {
            color: '#ee6666'
          }
        },
        {
          name: '修复后',
          type: 'bar',
          stack: '总量',
          label: {
            show: true,
            position: 'inside'
          },
          emphasis: {
            focus: 'series'
          },
          data: stats.security_score.map(item => item.after),
          itemStyle: {
            color: '#91cc75'
          }
        }
      ]
    };
  };

  // 风险评分雷达图配置
  const getRiskScoreOption = () => {
    if (!stats) return {};

    return {
      title: {
        text: '漏洞风险评分',
        left: 'center',
        textStyle: {
          fontSize: 16,
          color: '#333'
        }
      },
      tooltip: {},
      radar: {
        shape: 'circle',
        indicator: stats.vulnerability_types.map(item => ({
          name: item.name,
          max: 10
        }))
      },
      series: [
        {
          name: '风险评分',
          type: 'radar',
          data: [
            {
              value: stats.vulnerability_types.map(item => item.risk_score),
              name: '风险评分',
              symbolSize: 8,
              lineStyle: {
                width: 3
              },
              areaStyle: {
                color: 'rgba(73, 151, 238, 0.2)'
              },
              itemStyle: {
                color: '#4997ee'
              }
            }
          ]
        }
      ]
    };
  };

  // 渲染加载状态或错误信息
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <p style={{ marginTop: 20 }}>正在加载统计数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="statistics-page">
      <Title level={2} style={{ textAlign: 'center', marginBottom: 30 }}>
        <LineChartOutlined /> 漏洞分析统计
      </Title>
      
      <Paragraph style={{ textAlign: 'center', marginBottom: 40 }}>
        本页面展示了Web应用漏洞扫描的统计分析结果，包括漏洞类型分布、攻击趋势、性能影响和修复效果。
      </Paragraph>

      <Divider orientation="left">漏洞分析</Divider>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title={<><PieChartOutlined /> 漏洞类型分布</>} 
            bordered={false}
            className="chart-card"
            style={{ height: 450 }}
          >
            <ReactEcharts option={getVulnerabilityTypeOption()} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<><BarChartOutlined /> 月度攻击趋势</>} 
            bordered={false}
            className="chart-card"
            style={{ height: 450 }}
          >
            <ReactEcharts option={getMonthlyAttacksOption()} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">性能与修复效果</Divider>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title={<><BarChartOutlined /> 系统响应时间对比</>} 
            bordered={false}
            className="chart-card"
            style={{ height: 450 }}
          >
            <ReactEcharts option={getResponseTimeOption()} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<><RiseOutlined /> 安全评分改进</>} 
            bordered={false}
            className="chart-card"
            style={{ height: 450 }}
          >
            <ReactEcharts option={getSecurityScoreOption()} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">风险分析</Divider>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={24} lg={24}>
          <Card 
            title={<><LineChartOutlined /> 漏洞风险评分</>} 
            bordered={false}
            className="chart-card"
            style={{ height: 450 }}
          >
            <ReactEcharts option={getRiskScoreOption()} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics; 