const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();

app.use(bodyParser.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "employee_management"
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database!');
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Login API
app.post('/login', [
  check('f_userName', 'Username is required').notEmpty(),
  check('f_Pwd', 'Password is required').notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { f_userName, f_Pwd } = req.body;
  const query = `SELECT * FROM t_login WHERE f_userName =? AND f_Pwd =?`;
  db.query(query, [f_userName, f_Pwd], (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else if (results.length === 0) {
      res.status(401).send({ message: 'Invalid login credentials' });
    } else {
      res.send({ message: 'Login successful' });
    }
  });
});

// Create Employee API
app.post('/employee', upload.single('f_Image'), [
  check('f_Name', 'Name is required').notEmpty(),
  check('f_Email', 'Email is required').isEmail(),
  check('f_Mobile', 'Mobile is required').notEmpty(),
  check('f_Designation', 'Designation is required').notEmpty(),
  check('f_gender', 'Gender is required').notEmpty(),
  check('f_Course', 'Course is required').notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { f_Name, f_Email, f_Mobile, f_Designation, f_gender, f_Course } = req.body;
  const image = req.file ? req.file.path : null;

  const query = `INSERT INTO t_Employee (f_Name, f_Email, f_Mobile, f_Designation, f_gender, f_Course, f_Image) VALUES (?,?,?,?,?,?,?)`;
  db.query(query, [f_Name, f_Email, f_Mobile, f_Designation, f_gender, f_Course, image], (err, results) => {
    if (err) {
      console.error('Error creating employee:', err);
      res.status(500).json({ error: 'Failed to create employee' });
    } else {
      res.json({ message: 'Employee created successfully' });
    }
  });
});

// Get Employee List API
app.get('/employees', (req, res) => {
  const query = `SELECT * FROM t_Employee`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(results);
    }
  });
});

// Edit Employee API
app.put('/employee/:id', upload.single('f_Image'), [
  check('f_Name', 'Name is required').notEmpty(),
  check('f_Email', 'Email is required').isEmail(),
  check('f_Mobile', 'Mobile is required').notEmpty(),
  check('f_Designation', 'Designation is required').notEmpty(),
  check('f_gender', 'Gender is required').notEmpty(),
  check('f_Course', 'Course is required').notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = req.params.id;
  const { f_Name, f_Email, f_Mobile, f_Designation, f_gender, f_Course } = req.body;
  const image = req.file ? req.file.path : null;

  const query = `UPDATE t_Employee SET f_Name =?, f_Email =?, f_Mobile =?, f_Designation =?, f_gender =?, f_Course =?, f_Image =? WHERE f_Id =?`;
  db.query(query, [f_Name, f_Email, f_Mobile, f_Designation, f_gender, f_Course, image, id], (err, results) => {
    if (err) {
      console.error('Error updating employee:', err);
      res.status(500).json({ error: 'Failed to update employee' });
    } else {
      res.json({ message: 'Employee updated successfully' });
    }
  });
});

// Delete Employee API


// Delete Employee API
app.delete('/employee/:id', (req, res) => {
  const id = req.params.id;
  console.log(`Received ID: ${id}`); // Add this line to check the ID value
  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }
  const query = 'DELETE FROM t_Employee WHERE f_Id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error deleting employee:', err);
      return res.status(500).json({ error: 'Failed to delete employee' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  });
});


// Serve static files (for uploaded images)
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
