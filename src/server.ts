import { initialize } from './config/passport';
import passport from 'passport';

import app from './app';
import { Database } from './config/database';

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    const database = Database.getInstance();
    await database.connect();
    await database.initializeIndexes();
    
    initialize(passport);
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

