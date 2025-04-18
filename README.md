# Recipeasy-backend

[App here:](https://stupefied-morse-5e1233.netlify.com/)
Currently still using Firebase.

### Status

Structure set up and organized, now functionality is being built. 

## Overview and Thoughts

### What's Working

It's spun up and working with passportjs for authorization. Full Authorization flow is now in place with Email Verification and Password Reset, along with validation of all incoming data and DB calls.  

### What isn't working

- Everything that *should* working, is.

## Where are we?

### Working (not feature complete, full design still in progress):

- Server runs and connects to MongoDB 
- User registration
- User Register/Login/logout
- CSRF, Helmet working
- Email Verification (register and login)
- password resets
- Schema Creation & Validation for Incoming, DB saves, and Outgoing data
- Recipe CRUD
- User Persistence

### Working on Now:

- data persistence

### To Come:

- get 'passwordResetInProgress' working
- Global Error Handler 
- Remove console.logs and prioritize TODOs (before deploy, after)
- Deploy: 
    - sameSite: 'strict/lax', httpOnly: true, secure: true, 
    - ensure middleware security checks and limiters(readd). 
    - CORS allowed origins
    - Sanitize Middleware
    - Atlast - IP whitelist, Database User setup, network Encryption Enforced, Audit Logging enabled (?)
    - run OWASP ZAP (or other security scanner)
    - pentests (Detectify or others)
    - Monitoring for sus action. 
    - Backups
- Recipe Search
- Cron based softdeleted/unrefd recipe deletion
- Logging (Sonar? others)
- Testing
- Full Documentation
- User Admin (update/delete)
- Functional testing
- Google/Facebook login (maybe)

## Built With

- Expressjs
- MongoDb
- TypeScript
- Express-sessions
- Passportjs
- bCrypt
- Helmet
- csrf

## Author

- **Ethan Strauss** - [Portfolio](https://dotethan.github.io)
