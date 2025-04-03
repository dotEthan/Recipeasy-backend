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
- Schema Creation for Authorization flows and DB inserts

### Not Working

### Working on Now:

- Schema Creation - res.json() verification needed)

### To Come:

- Recipe CRUD
- Global Error Handler (structure w/ pinia)
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
- Testing
- Full Documentation
- User Admin (update/delete)
- Passportjs linked code refactor - ensure proper structure and only needed config values (Config pains - went through numerous versions)
- Functional testing
- Google/Facebook login (maybe)

## Built With

- Expressjs
- MongoDb
- TypeScript
- Passportjs
- bCrypt
- Helmet
- csrf

## Author

- **Ethan Strauss** - [Portfolio](https://dotethan.github.io)
