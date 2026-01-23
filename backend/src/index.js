
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const supabase = require('./config/supabase');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/stores', require('./routes/stores'));
// app.use('/api/credits', require('./routes/credits'));

// Health check
app.get('/', (req, res) => {
    res.send('StorePlatform API is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
