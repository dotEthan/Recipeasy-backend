# Recipeasy-backend

[App here:](https://stupefied-morse-5e1233.netlify.com/)
Currently still using Firebase.

### Status

Structure set up and organized, now functionality is being built. 

## Overview and Thoughts

### What's Working

It's spun up and working with passportjs for authorization. Full Authorization flow is now in place with Email Verification and Password Reset, along with validation of all incoming data and DB calls.  

### What isn't working

- I built it slightly backward. After years of working on enterprise scale software I fell into the habit of getting a working prototype going, then an MVP, version 1.0, etc. This required a lot more going back and rebuilding pieces, and focusing on one aspect at a time. Instead as it was a medium sized project and just me, building out an entire error handling, security, and testing first would have made writing the code and finding/fixing bugs faster, and I could have handled most of hte errors as I had them along the way. 
- But functionally what should be working, is.

### Code Choices

- Functional VS OOP - a bit mixed, trying to implement more with OOP as I haven't used it as much as functional in past projects
- No Mongoose - I have worked with Mongoose, but I wanted to get a better feel for MongoDB directly. If I did it again, I'd use Mongoose.

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
- Cloudinary based image upload and deleting
- User Persistence (User Alterations of Public Recipes)
- data persistence
- Global Error Handler

### Working on Now:

- Retries where needed: 3 tries, fail and notify - Verification retries > 3 = new code, . 
- Code Cleaning (removing console logs, refactoring, etc), and Validation parsing & middleware, prioritizing TODOs (now VS later)
    - organize schemas, 'DRY' object IDs using multiple structures
    - All "Update" flows add "updatedAt"

### To Come:

- Deploy: 
    - sameSite: 'strict/lax', httpOnly: true, secure: true, 
    - ensure middleware security checks and limiters(readd). 
    - CORS allowed origins
    - Sanitize Middleware
    - Atlast - IP whitelist, Database User setup, network Encryption Enforced
    - run OWASP ZAP (or other security scanner)
    - pentests (Detectify or others)
    - Monitoring for sus action. 
    - Backups
    - Logging (Sonar? others)
- Look into OpenAPIdocs just to show jsDoc in structured format
- Testing
- Recipe Search
- Cron based softdeleted/unref'd recipe deletion (only if no user.recipes has ref'd), also if last user ref'ing, delete image in cloudinary
- Full Documentation (more than Jsdo)
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
