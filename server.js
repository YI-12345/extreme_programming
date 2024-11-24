const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 3000;

// 数据库连接
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'admin123', // 使用实际的数据库密码
    database: 'contact_db', // 使用实际的数据库名称
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 创建数据库和表格（如没有的话）
const createDatabase = () => {
    // 创建 contacts 表
    pool.query(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            is_favorite BOOLEAN DEFAULT FALSE
        );
    `, (err, result) => {
        if (err) {
            console.error("创建 contacts 表时出错:", err);
            return;
        }
        console.log("contacts 表创建成功或已存在。");
    });

    // 创建 contact_details 表
    pool.query(`
        CREATE TABLE IF NOT EXISTS contact_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            contact_id INT NOT NULL,
            contact_type VARCHAR(50) NOT NULL,
            contact_value VARCHAR(255) NOT NULL,
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
        );
    `, (err, result) => {
        if (err) {
            console.error("创建 contact_details 表时出错:", err);
            return;
        }
        console.log("contact_details 表创建成功或已存在。");
    });
};

createDatabase();

// 获取所有联系人及其联系方式
app.get('/api/contacts', (req, res) => {
    pool.query('SELECT * FROM contacts', (err, contacts) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);  // 确保只发送一次响应
        }

        const contactIds = contacts.map(contact => contact.id);

        if (contactIds.length === 0) {
            return res.json([]);  // 如果没有联系人，直接返回空数组
        }

        pool.query('SELECT * FROM contact_details WHERE contact_id IN (?)', [contactIds], (err, details) => {
            if (err) {
                console.error(err);
                return res.status(500).send(err);  // 确保只发送一次响应
            }

            contacts.forEach(contact => {
                contact.details = details.filter(detail => detail.contact_id === contact.id);
            });
            res.json(contacts);  // 确保只发送一次响应
        });
    });
});

// 添加联系人并保存联系方式
app.post('/api/contacts', (req, res) => {
    const { name, details } = req.body;

    if (!name || !details || details.length === 0) {
        return res.status(400).json({ error: '姓名和联系方式不能为空' });
    }

    // 插入联系人
    pool.query('INSERT INTO contacts (name) VALUES (?)', [name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);  // 确保只发送一次响应
        }

        const contactId = result.insertId;

        // 插入多个联系方式
        let insertCount = 0;
        details.forEach(detail => {
            pool.query('INSERT INTO contact_details (contact_id, contact_type, contact_value) VALUES (?, ?, ?)', 
                [contactId, detail.contact_type, detail.contact_value], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send(err);  // 确保只发送一次响应
                    }
                    insertCount++;
                    if (insertCount === details.length) {
                        return res.status(201).send({ success: true });  // 确保最后一次响应
                    }
                });
        });
    });
});