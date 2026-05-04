const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const coachRoutes = require('./routes/coaches');
const mealPlanRoutes = require('./routes/mealplans');
const metricRoutes = require('./routes/metrics');
const nutritionRoutes = require('./routes/nutrition');
const ownerRoutes = require('./routes/owner');
const sessionRoutes = require('./routes/sessions');
const workoutRoutes = require('./routes/workouts');
const { getAllowedClientOrigins } = require('./utils/clientAppUrl');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedClientOrigins = getAllowedClientOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedClientOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/mealplans', mealPlanRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/workouts', workoutRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
