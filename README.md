# Recipeasy-backend

[App here:](https://stupefied-morse-5e1233.netlify.com/)
Currently still using Firebase.

### Status

Structure set up and organized, now functionality is being built. 

## Overview and Thoughts

### What's Working

Backend Functionality has now surpassed Front-end, and contains full login, verficiation, and PW reset flows, and a fully working Recipe CRUD structure that allows for public VS private recipes, soft deletes to ensure shared recipes retain functionality beyond creator deletion and the structure for global error handling, schema parsing, and a variety of middleware to ensure security and deter bots and 'attacks'. 

### What isn't working

- It's all working, but I would have saved a lot of time if I built the error handling and tests first. I wanted something to show faster so I build it a bit backwards. But it's coming together.

### Code Choices

- Functional VS OOP - a bit mixed, trying to implement more with classes as I haven't used it as much as functional in past projects
- JSDoc galore - I both wanted to practice JSDoc and as this is soemthign I will likely be coming back to (I use it for myself), having well laid out docs of everything will be a joy years later. 
- No Mongoose - I have worked with Mongoose, but I wanted to get a better feel for MongoDB directly. If I did it again, I'd use Mongoose.
- JWT tokens VS Csrf - I had csrf but they were not working well with passportjs/express-sessions as the sessions were continually being recreated and the token lost. JWT tokens works better here as they're not dependent on sessions

## Where are we?

### Working (not feature complete, full design still in progress):

- Server runs and connects to MongoDB 
- User registration
- User Register/Login/logout
- JWT AccessToken, Helmet working
- Email Verification (register and login)
- password resets
- Schema Creation & Validation for Incoming, DB saves, and Outgoing data
- Recipe CRUD
- Cloudinary based image upload and deleting
- User Persistence (User Alterations of Public Recipes)
- data persistence
- Global Error Handler (structure, not fully fleshed out)

### Working on Now:

- Deploy: 
    - Sanitize Middleware
    - run OWASP ZAP (or other security scanner)
    - Backups
   

### To Come:

- Redis (caching)
- Logging (Sonar? others)
- Expand Validation (trim strings to be compared (names, email, inputs)), (toLowercase emails, usernames, capitalize on frontend if needed)
- /types/enums.ts VS /enums/index.ts (refactor)
- organize schemas (duplicates? generify existing)
- setup retry-ables
- Final erorr sweep, missing and duplicates
- Look into OpenAPIdocs just to show jsDoc in structured format
- Testing
- Recipe Search/ingredient auto complete
- Cron based softdeleted/unref'd recipe deletion (only if no user.recipes has ref'd), also if last user ref'ing, delete image in cloudinary
- User Admin (update/delete)
- integraton and E2E testing
- Google/Facebook login (maybe)

## Built With

- Expressjs
- MongoDb
- TypeScript
- Express-sessions
- Passportjs
- bCrypt
- Helmet
- JWT

## Author

- **Ethan Strauss** - [Portfolio](https://dotethan.github.io)
