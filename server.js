const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Konfigurasi CORS
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
  res.status(200).send();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});

app.use(express.json());

// Konfigurasi database
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'database_steam'
};

// Fungsi koneksi database
const createConnection = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Inisialisasi database
const initializeDatabase = async () => {
  try {
    const connection = await createConnection();
    
    // Buat tabel untuk sistem kontrol steam
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_status (
        id INT PRIMARY KEY AUTO_INCREMENT,
        steam_pressure FLOAT DEFAULT 0,
        temperature FLOAT DEFAULT 25,
        water_level FLOAT DEFAULT 75,
        motor_speed INT DEFAULT 0,
        voltage FLOAT DEFAULT 220,
        is_running BOOLEAN DEFAULT 0,
        target_pressure FLOAT DEFAULT 5,
        target_speed INT DEFAULT 1800,
        active_motors INT DEFAULT 3,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS resource_usage (
        id INT PRIMARY KEY AUTO_INCREMENT,
        energy_consumption FLOAT DEFAULT 0,
        water_usage FLOAT DEFAULT 0,
        soap_usage FLOAT DEFAULT 0,
        wash_duration FLOAT DEFAULT 0,
        wash_sessions INT DEFAULT 0,
        total_revenue FLOAT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tariffs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        electricity FLOAT DEFAULT 1500,
        water FLOAT DEFAULT 500,
        soap FLOAT DEFAULT 50,
        service_price FLOAT DEFAULT 15000
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS realtime_debits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        water_debit FLOAT DEFAULT 0,
        soap_debit FLOAT DEFAULT 0,
        energy_debit FLOAT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('danger', 'warning') NOT NULL,
        message VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Buat tabel untuk manajemen anggota
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS members (
        id INT PRIMARY KEY AUTO_INCREMENT,
        uuid VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Buat tabel untuk CNC TodoList dengan PIC field
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cnc_todos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        uuid VARCHAR(36) NOT NULL,
        task VARCHAR(255) NOT NULL,
        pic VARCHAR(100) DEFAULT NULL,
        status ENUM('pending', 'running', 'completed') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tambahkan kolom PIC jika belum ada (untuk backward compatibility)
    try {
      await connection.execute(`
        ALTER TABLE cnc_todos ADD COLUMN pic VARCHAR(100) DEFAULT NULL
      `);
      console.log('PIC column added to cnc_todos table');
    } catch (error) {
      // Kolom mungkin sudah ada, tidak perlu menambahkan lagi
      if (!error.message.includes('Duplicate column name')) {
        console.error('Error adding PIC column:', error);
      }
    }

    // Insert data awal untuk sistem kontrol
    const [statusRows] = await connection.execute('SELECT * FROM system_status');
    if (statusRows.length === 0) {
      await connection.execute('INSERT INTO system_status (id) VALUES (1)');
    }

    const [resourceRows] = await connection.execute('SELECT * FROM resource_usage');
    if (resourceRows.length === 0) {
      await connection.execute('INSERT INTO resource_usage (id) VALUES (1)');
    }

    const [tariffRows] = await connection.execute('SELECT * FROM tariffs');
    if (tariffRows.length === 0) {
      await connection.execute('INSERT INTO tariffs (id) VALUES (1)');
    }

    const [debitRows] = await connection.execute('SELECT * FROM realtime_debits');
    if (debitRows.length === 0) {
      await connection.execute('INSERT INTO realtime_debits (id) VALUES (1)');
    }

    // Insert data sample untuk CNC TodoList dengan PIC
    const [todoRows] = await connection.execute('SELECT * FROM cnc_todos');
    if (todoRows.length === 0) {
      await connection.execute(`
        INSERT INTO cnc_todos (uuid, task, pic, status, priority) VALUES
        (UUID(), 'Setup workpiece alignment', 'John Smith', 'completed', 'high'),
        (UUID(), 'Load G-code program', 'Maria Garcia', 'running', 'high'),
        (UUID(), 'Calibrate tool offset', 'David Johnson', 'pending', 'medium'),
        (UUID(), 'Check coolant level', 'Sarah Wilson', 'pending', 'low')
      `);
    }

    await connection.end();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

// Uncomment this line to initialize the database
// initializeDatabase();

// ====================================
// ENDPOINT UNTUK SISTEM KONTROL STEAM
// ====================================

// GET: Status sistem
app.get('/api/status', async (req, res) => {
  try {
    const connection = await createConnection();
    const [status] = await connection.query('SELECT * FROM system_status WHERE id = 1');
    const [resources] = await connection.query('SELECT * FROM resource_usage WHERE id = 1');
    const [tariffs] = await connection.query('SELECT * FROM tariffs WHERE id = 1');
    const [debits] = await connection.query('SELECT * FROM realtime_debits WHERE id = 1');
    const [alerts] = await connection.query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10');
    await connection.end();

    res.json({
      success: true,
      data: {
        systemStatus: status[0],
        resourceUsage: resources[0],
        tariffs: tariffs[0],
        realtimeDebits: debits[0],
        alerts
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// POST: Update status sistem
app.post('/api/update-status', async (req, res) => {
  const updates = req.body;
  try {
    const connection = await createConnection();
    await connection.query('UPDATE system_status SET ? WHERE id = 1', [updates]);
    await connection.end();
    res.json({ 
      success: true,
      message: 'Status updated successfully' 
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update status' 
    });
  }
});

// POST: Update penggunaan sumber daya
app.post('/api/update-resources', async (req, res) => {
  const updates = req.body;
  try {
    const connection = await createConnection();
    await connection.query('UPDATE resource_usage SET ? WHERE id = 1', [updates]);
    await connection.end();
    res.json({ 
      success: true,
      message: 'Resources updated successfully' 
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update resources' 
    });
  }
});

// POST: Tambah alert
app.post('/api/add-alert', async (req, res) => {
  const { type, message } = req.body;
  try {
    const connection = await createConnection();
    await connection.query('INSERT INTO alerts (type, message) VALUES (?, ?)', [type, message]);
    await connection.end();
    res.json({ 
      success: true,
      message: 'Alert added successfully' 
    });
  } catch (error) {
    console.error('Alert error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add alert' 
    });
  }
});

// POST: Reset counters
app.post('/api/reset', async (req, res) => {
  try {
    const connection = await createConnection();
    await connection.query('UPDATE resource_usage SET energy_consumption = 0, water_usage = 0, soap_usage = 0, wash_duration = 0, wash_sessions = 0, total_revenue = 0 WHERE id = 1');
    await connection.query('DELETE FROM alerts');
    await connection.end();
    res.json({ 
      success: true,
      message: 'System reset successfully' 
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reset system' 
    });
  }
});

// ====================================
// ENDPOINT UNTUK MANAJEMEN ANGGOTA
// ====================================

// GET: Dapatkan semua anggota
app.get('/api/members', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM members ORDER BY id DESC');
    await connection.end();
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members'
    });
  }
});

// GET: Dapatkan anggota berdasarkan ID
app.get('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM members WHERE id = ?', [id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member'
    });
  }
});

// POST: Buat anggota baru
app.post('/api/members', async (req, res) => {
  try {
    const { name, address } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name and address are required'
      });
    }
    
    const uuid = uuidv4();
    const connection = await createConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO members (uuid, name, address) VALUES (?, ?, ?)',
      [uuid, name, address]
    );
    
    await connection.end();
    
    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: {
        id: result.insertId,
        uuid: uuid,
        name: name,
        address: address
      }
    });
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create member'
    });
  }
});

// PUT: Update anggota
app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name and address are required'
      });
    }
    
    const connection = await createConnection();
    
    // Cek apakah anggota ada
    const [existingMember] = await connection.execute('SELECT * FROM members WHERE id = ?', [id]);
    if (existingMember.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Update anggota
    await connection.execute(
      'UPDATE members SET name = ?, address = ? WHERE id = ?',
      [name, address, id]
    );
    
    // Dapatkan data anggota yang telah diupdate
    const [updatedMember] = await connection.execute('SELECT * FROM members WHERE id = ?', [id]);
    await connection.end();
    
    res.json({
      success: true,
      message: 'Member updated successfully',
      data: updatedMember[0]
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member'
    });
  }
});

// DELETE: Hapus anggota
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createConnection();
    
    // Cek apakah anggota ada
    const [existingMember] = await connection.execute('SELECT * FROM members WHERE id = ?', [id]);
    if (existingMember.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Hapus anggota
    await connection.execute('DELETE FROM members WHERE id = ?', [id]);
    await connection.end();
    
    res.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete member'
    });
  }
});

// ====================================
// ENDPOINT UNTUK CNC TODOLIST (DENGAN PIC)
// ====================================

// GET: Dapatkan semua todos
app.get('/api/todos', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM cnc_todos ORDER BY id DESC');
    await connection.end();
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch todos'
    });
  }
});

// GET: Dapatkan todo berdasarkan ID
app.get('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM cnc_todos WHERE id = ?', [id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch todo'
    });
  }
});

// POST: Buat todo baru (dengan PIC)
app.post('/api/todos', async (req, res) => {
  try {
    const { task, priority = 'medium', pic } = req.body;
    
    if (!task) {
      return res.status(400).json({
        success: false,
        message: 'Task is required'
      });
    }
    
    const uuid = uuidv4();
    const connection = await createConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO cnc_todos (uuid, task, pic, priority) VALUES (?, ?, ?, ?)',
      [uuid, task, pic || null, priority]
    );
    
    // Dapatkan data todo yang baru dibuat
    const [newTodo] = await connection.execute('SELECT * FROM cnc_todos WHERE id = ?', [result.insertId]);
    await connection.end();
    
    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: newTodo[0]
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create todo'
    });
  }
});

// PUT: Update todo (dengan PIC)
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { task, status, priority, pic } = req.body;
    
    const connection = await createConnection();
    
    // Cek apakah todo ada
    const [existingTodo] = await connection.execute('SELECT * FROM cnc_todos WHERE id = ?', [id]);
    if (existingTodo.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    // Siapkan update data
    const updates = {};
    if (task !== undefined) updates.task = task;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (pic !== undefined) updates.pic = pic || null;
    
    if (Object.keys(updates).length === 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'No data to update'
      });
    }
    
    // Update todo
    const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updates);
    
    await connection.execute(
      `UPDATE cnc_todos SET ${updateFields} WHERE id = ?`,
      [...updateValues, id]
    );
    
    // Dapatkan data todo yang telah diupdate
    const [updatedTodo] = await connection.execute('SELECT * FROM cnc_todos WHERE id = ?', [id]);
    await connection.end();
    
    res.json({
      success: true,
      message: 'Todo updated successfully',
      data: updatedTodo[0]
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update todo'
    });
  }
});

// DELETE: Hapus todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createConnection();
    
    // Cek apakah todo ada
    const [existingTodo] = await connection.execute('SELECT * FROM cnc_todos WHERE id = ?', [id]);
    if (existingTodo.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    // Hapus todo
    await connection.execute('DELETE FROM cnc_todos WHERE id = ?', [id]);
    await connection.end();
    
    res.json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete todo'
    });
  }
});

// GET: Dashboard statistics untuk todos (dengan PIC stats)
app.get('/api/todos/dashboard/stats', async (req, res) => {
  try {
    const connection = await createConnection();
    
    // Statistik berdasarkan status
    const [statusStats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM cnc_todos 
      GROUP BY status
    `);
    
    // Statistik berdasarkan priority
    const [priorityStats] = await connection.execute(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM cnc_todos 
      GROUP BY priority
    `);
    
    // Statistik berdasarkan PIC
    const [picStats] = await connection.execute(`
      SELECT 
        COALESCE(pic, 'Unassigned') as pic,
        COUNT(*) as count
      FROM cnc_todos 
      GROUP BY pic
      ORDER BY count DESC
    `);
    
    // Total todos
    const [totalCount] = await connection.execute('SELECT COUNT(*) as total FROM cnc_todos');
    
    // Todos yang sedang running
    const [runningTodos] = await connection.execute(`
      SELECT * FROM cnc_todos 
      WHERE status = 'running' 
      ORDER BY created_at DESC
    `);
    
    // Todos berprioritas tinggi yang pending
    const [highPriorityPending] = await connection.execute(`
      SELECT * FROM cnc_todos 
      WHERE priority = 'high' AND status = 'pending' 
      ORDER BY created_at DESC
    `);
    
    // Todos tanpa PIC
    const [unassignedTodos] = await connection.execute(`
      SELECT COUNT(*) as count FROM cnc_todos 
      WHERE pic IS NULL OR pic = ''
    `);
    
    await connection.end();
    
    res.json({
      success: true,
      data: {
        totalTodos: totalCount[0].total,
        statusStats: statusStats.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
        priorityStats: priorityStats.reduce((acc, item) => {
          acc[item.priority] = item.count;
          return acc;
        }, {}),
        picStats: picStats.reduce((acc, item) => {
          acc[item.pic] = item.count;
          return acc;
        }, {}),
        runningTodos,
        highPriorityPending,
        unassignedTodos: unassignedTodos[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// GET: Dapatkan todos berdasarkan PIC
app.get('/api/todos/by-pic/:pic', async (req, res) => {
  try {
    const { pic } = req.params;
    const connection = await createConnection();
    
    const query = pic === 'unassigned' 
      ? 'SELECT * FROM cnc_todos WHERE pic IS NULL OR pic = "" ORDER BY created_at DESC'
      : 'SELECT * FROM cnc_todos WHERE pic = ? ORDER BY created_at DESC';
    
    const params = pic === 'unassigned' ? [] : [pic];
    const [rows] = await connection.execute(query, params);
    await connection.end();
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching todos by PIC:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch todos by PIC'
    });
  }
});

// GET: Dapatkan semua PIC yang unik
app.get('/api/todos/pics', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute(`
      SELECT DISTINCT pic 
      FROM cnc_todos 
      WHERE pic IS NOT NULL AND pic != ""
      ORDER BY pic ASC
    `);
    await connection.end();
    
    res.json({
      success: true,
      data: rows.map(row => row.pic)
    });
  } catch (error) {
    console.error('Error fetching PICs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PICs'
    });
  }
});

// ====================================
// ENDPOINT UMUM
// ====================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET    /api/status',
      'POST   /api/update-status',
      'POST   /api/update-resources',
      'POST   /api/add-alert',
      'POST   /api/reset',
      'GET    /api/members',
      'GET    /api/members/:id',
      'POST   /api/members',
      'PUT    /api/members/:id',
      'DELETE /api/members/:id',
      'GET    /api/todos',
      'GET    /api/todos/:id',
      'POST   /api/todos',
      'PUT    /api/todos/:id',
      'DELETE /api/todos/:id',
      'GET    /api/todos/dashboard/stats',
      'GET    /api/todos/by-pic/:pic',
      'GET    /api/todos/pics'
    ]
  });
});

// Simulator data untuk sistem kontrol steam
setInterval(async () => {
  try {
    const connection = await createConnection();
    
    // Ambil status terkini
    const [status] = await connection.query('SELECT * FROM system_status WHERE id = 1');
    const currentStatus = status[0];
    
    if (currentStatus.is_running) {
      // Generate data baru
      const newEnergyDebit = 2.5 + Math.random() * 0.5;
      const newWaterDebit = 15 + Math.random() * 5;
      const newSoapDebit = 25 + Math.random() * 10;
      
      const updates = {
        steam_pressure: Math.max(0, Math.min(10, currentStatus.steam_pressure + (Math.random() - 0.5) * 0.5)),
        temperature: Math.max(20, Math.min(150, currentStatus.temperature + (Math.random() - 0.5) * 2)),
        water_level: Math.max(0, Math.min(100, currentStatus.water_level - Math.random() * 0.1)),
        motor_speed: currentStatus.motor_speed + (currentStatus.target_speed - currentStatus.motor_speed) * 0.1 + (Math.random() - 0.5) * 10,
        voltage: Math.max(200, Math.min(240, currentStatus.voltage + (Math.random() - 0.5) * 5))
      };
      
      // Update status sistem
      await connection.query('UPDATE system_status SET ? WHERE id = 1', [updates]);
      
      // Update debit real-time
      await connection.query('UPDATE realtime_debits SET ? WHERE id = 1', {
        water_debit: newWaterDebit,
        soap_debit: newSoapDebit,
        energy_debit: newEnergyDebit
      });
      
      // Update penggunaan sumber daya
      await connection.query(`
        UPDATE resource_usage SET
          energy_consumption = energy_consumption + ?,
          water_usage = water_usage + ?,
          soap_usage = soap_usage + ?,
          wash_duration = wash_duration + ?
        WHERE id = 1
      `, [
        newEnergyDebit * (0.5/3600),
        newWaterDebit * (0.5/60),
        newSoapDebit * (0.5/60),
        0.5/60
      ]);
      
      // Generate alerts jika diperlukan
      if (updates.steam_pressure > 8) {
        await connection.query(
          'INSERT INTO alerts (type, message) VALUES (?, ?)',
          ['danger', 'Tekanan steam terlalu tinggi!']
        );
      }
      
      if (updates.temperature > 120) {
        await connection.query(
          'INSERT INTO alerts (type, message) VALUES (?, ?)',
          ['warning', 'Suhu mendekati batas maksimum']
        );
      }
    }
    
    await connection.end();
  } catch (error) {
    console.error('Simulation error:', error);
  }
}, 500);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server with comprehensive API documentation
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('');
  console.log('================================= AVAILABLE ENDPOINTS =================================');
  console.log('');
  console.log('============================= STEAM CONTROL SYSTEM API ================================');
  console.log('GET    /api/status          - Get system status, resources, tariffs and alerts');
  console.log('POST   /api/update-status   - Update system parameters');
  console.log('        Request body: { steam_pressure, temperature, water_level, motor_speed, voltage, is_running, target_pressure, target_speed, active_motors }');
  console.log('POST   /api/update-resources- Update resource usage');
  console.log('        Request body: { energy_consumption, water_usage, soap_usage, wash_duration, wash_sessions, total_revenue }');
  console.log('POST   /api/add-alert       - Add new alert');
  console.log('        Request body: { type: "danger"|"warning", message: string }');
  console.log('POST   /api/reset           - Reset system counters and alerts');
  console.log('');
  console.log('=============================== MEMBER MANAGEMENT API ================================');
  console.log('GET    /api/members         - Get all members');
  console.log('GET    /api/members/:id     - Get member by ID');
  console.log('POST   /api/members         - Create new member');
  console.log('        Request body: { name: string, address: string }');
  console.log('PUT    /api/members/:id     - Update member');
  console.log('        Request body: { name: string, address: string }');
  console.log('DELETE /api/members/:id     - Delete member');
  console.log('');
  console.log('================================ CNC TODO LIST API ===================================');
  console.log('GET    /api/todos           - Get all todos');
  console.log('GET    /api/todos/:id       - Get todo by ID');
  console.log('POST   /api/todos           - Create new todo');
  console.log('        Request body: { task: string, priority?: "low"|"medium"|"high", pic?: string }');
  console.log('PUT    /api/todos/:id       - Update todo');
  console.log('        Request body: { task?: string, status?: "pending"|"running"|"completed", priority?: "low"|"medium"|"high", pic?: string }');
  console.log('DELETE /api/todos/:id       - Delete todo');
  console.log('GET    /api/todos/dashboard/stats - Get dashboard statistics');
  console.log('GET    /api/todos/by-pic/:pic - Get todos by PIC (use "unassigned" for unassigned todos)');
  console.log('GET    /api/todos/pics      - Get list of unique PICs');
  console.log('');
  console.log('================================= GENERAL API ========================================');
  console.log('GET    /api/health          - Health check and endpoint list');
  console.log('');
  console.log('======================================================================================');
});
