# Recipeasy-backend

[App here:](https://stupefied-morse-5e1233.netlify.com/)
Currently still using Firebase.

### Status

Structure set up and organized, now functionality is being built. 

## Overview and Thoughts

### What's Working

Backend Functionality has now surpassed Front-end, and contains full login, verficiation, and PW reset flows, and a fully working Recipe CRUD structure that allows for public VS private recipes, soft deletes to ensure shared recipes retain functionality beyond creator deletion and the structure for global error handling, schema parsing, and a variety of middleware to ensure security and deter bots and 'attacks'. 

### What isn't working

- I built it slightly backward. After years of working on enterprise scale software I fell into the habit of getting a working prototype going, then an MVP, version 1.0, etc. This required a lot more going back and rebuilding pieces, and focusing on one aspect at a time. Instead as it was a medium sized project and just me, building out an entire error handling, security, and testing first would have made writing the code and finding/fixing bugs faster, and I could have handled most of hte errors as I had them along the way. 
- But functionally what should be working, is.

### Code Choices

- Functional VS OOP - a bit mixed, trying to implement more with classes as I haven't used it as much as functional in past projects
- JSDoc galore - I both wanted to practice JSDoc and as this is soemthign i will likely be coming back to (I use it for myself), I know having well laid out docs of everything is a joy two years later. 
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

- Deploy: 
    - CORS allowed origins
    - Sanitize Middleware
    - Atlast - IP whitelist, Database User setup, network Encryption Enforced
    - run OWASP ZAP (or other security scanner)
    - pentests (Detectify or others)
    - Monitoring for sus action. 
    - Backups
    - Logging (Sonar? others)

### To Come:

- Redis (caching)
- Expand Validation (trim strings to be compared (names, email, inputs)), (toLowercase emails, usernames, capitalize on frontend if needed)
- /types/enums.ts VS /enums/index.ts    
- organize schemas
- setup retry-ables
- Final erorr sweep, missing and duplicates
- Look into OpenAPIdocs just to show jsDoc in structured format
- Testing
- Recipe Search/ingredient auto complete
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
