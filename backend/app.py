from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sqlite3
import json
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 启用跨域资源共享

# 数据库初始化
def init_db():
    conn = sqlite3.connect('vulnerabilities.db')
    c = conn.cursor()
    
    # 创建用户表
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 创建日志表
    c.execute('''
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vulnerability_type TEXT NOT NULL,
        details TEXT,
        severity TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 插入一些初始用户数据
    try:
        c.execute("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", 
                 ('admin', 'admin123', 'admin@example.com'))
        c.execute("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", 
                 ('test', 'test123', 'test@example.com'))
    except sqlite3.IntegrityError:
        # 用户已存在，跳过
        pass
    
    conn.commit()
    conn.close()

# 初始化数据库
init_db()

# 创建上传目录
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 漏洞示例1: SQL注入漏洞
@app.route('/api/users', methods=['GET'])
def get_user():
    username = request.args.get('username', '')
    
    # 不安全的SQL查询 - 容易受到SQL注入攻击
    conn = sqlite3.connect('vulnerabilities.db')
    c = conn.cursor()
    
    # 漏洞代码 - 直接拼接SQL语句
    query = f"SELECT * FROM users WHERE username = '{username}'"
    
    # 安全代码 - 使用参数化查询
    # query = "SELECT * FROM users WHERE username = ?"
    # c.execute(query, (username,))
    
    try:
        c.execute(query)
        user = c.fetchone()
        if user:
            return jsonify({
                'id': user[0],
                'username': user[1],
                'email': user[3],
                'created_at': user[4]
            })
        else:
            return jsonify({'error': 'User not found'}), 404
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 漏洞示例2: XSS漏洞
@app.route('/api/comments', methods=['GET', 'POST'])
def comments():
    if request.method == 'POST':
        data = request.get_json()
        comment = data.get('comment', '')
        
        # 存储评论（不进行任何清理）
        with open('comments.json', 'a+') as f:
            f.seek(0)
            try:
                comments_data = json.load(f)
            except json.JSONDecodeError:
                comments_data = []
            
            comments_data.append({
                'comment': comment,
                'timestamp': datetime.now().isoformat()
            })
            
            f.seek(0)
            f.truncate()
            json.dump(comments_data, f)
        
        return jsonify({'success': True})
    
    else:  # GET
        try:
            with open('comments.json', 'r') as f:
                comments_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            comments_data = []
        
        return jsonify(comments_data)

# 漏洞示例3: 不安全的文件上传
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # 不安全的文件保存 - 不检查文件类型或内容
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # 记录上传日志
    conn = sqlite3.connect('vulnerabilities.db')
    c = conn.cursor()
    c.execute("INSERT INTO logs (vulnerability_type, details, severity) VALUES (?, ?, ?)",
             ('File Upload', f'File uploaded: {filename}', 'Medium'))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'filename': filename,
        'path': file_path
    })

# 漏洞示例4: 不安全的直接对象引用
@app.route('/api/user_data/<user_id>', methods=['GET'])
def get_user_data(user_id):
    # 不验证用户是否有权限访问该ID的数据
    conn = sqlite3.connect('vulnerabilities.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'id': user[0],
            'username': user[1],
            'email': user[3],
            'created_at': user[4]
        })
    else:
        return jsonify({'error': 'User not found'}), 404

# 安全版本的API - 用于后端防护演示
@app.route('/api/secure/users', methods=['GET'])
def get_user_secure():
    username = request.args.get('username', '')
    
    # 安全的SQL查询 - 使用参数化查询防止SQL注入
    conn = sqlite3.connect('vulnerabilities.db')
    c = conn.cursor()
    query = "SELECT * FROM users WHERE username = ?"
    
    try:
        c.execute(query, (username,))
        user = c.fetchone()
        if user:
            return jsonify({
                'id': user[0],
                'username': user[1],
                'email': user[3],
                'created_at': user[4]
            })
        else:
            return jsonify({'error': 'User not found'}), 404
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# 获取漏洞日志
@app.route('/api/logs', methods=['GET'])
def get_logs():
    conn = sqlite3.connect('vulnerabilities.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM logs ORDER BY timestamp DESC")
    
    logs = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return jsonify(logs)

# 数据分析结果API - 提供漏洞统计数据
@app.route('/api/stats', methods=['GET'])
def get_stats():
    # 模拟数据 - 在实际应用中应该从数据库获取
    stats = {
        "vulnerability_types": [
            {"name": "SQL注入", "count": 25, "risk_score": 8.5},
            {"name": "XSS攻击", "count": 32, "risk_score": 7.2},
            {"name": "不安全文件上传", "count": 18, "risk_score": 6.8},
            {"name": "不安全直接对象引用", "count": 15, "risk_score": 5.5},
            {"name": "敏感数据泄露", "count": 10, "risk_score": 9.0}
        ],
        "monthly_attacks": [
            {"month": "一月", "attacks": 12},
            {"month": "二月", "attacks": 15},
            {"month": "三月", "attacks": 8},
            {"month": "四月", "attacks": 20},
            {"month": "五月", "attacks": 25},
            {"month": "六月", "attacks": 18},
            {"month": "七月", "attacks": 22},
            {"month": "八月", "attacks": 28},
            {"month": "九月", "attacks": 30},
            {"month": "十月", "attacks": 15},
            {"month": "十一月", "attacks": 21},
            {"month": "十二月", "attacks": 24}
        ],
        "response_time": [
            {"state": "攻击前", "time": 120},
            {"state": "攻击中", "time": 320},
            {"state": "修复后", "time": 100}
        ],
        "security_score": [
            {"category": "输入验证", "before": 40, "after": 85},
            {"category": "认证", "before": 55, "after": 90},
            {"category": "授权", "before": 60, "after": 88},
            {"category": "会话管理", "before": 45, "after": 82},
            {"category": "加密", "before": 65, "after": 92}
        ]
    }
    
    return jsonify(stats)

# 启动服务器
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 