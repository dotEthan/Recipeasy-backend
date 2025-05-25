# Tastyista-backend

Tastyista Rebranding underway here: https://tastyista.com/
Please be patient on first load, hosted on Render and it needs to spin up the server, will be upgrading the server tomorrow to ensure fast response times even on the first load

## Built With

- Expressjs
- MongoDb
- TypeScript
- Express-sessions
- Passportjs
- Zod
- bCrypt
- Helmet
- JWT tokens

### Status

API built and running using RESTful principles. 

## Overview and Thoughts

### What's Working

- Full login and security using JWTs for authorization, helmet, encrypted tokens for verification and password reset.
- Strict validation in and out using ZOD schemas with a global Error handler
- Multiple endpoints with authorization and rate-limiting middleware. 

### What's to come

- Proper searching and filtering based on frontend logic
- Full test suites for all code with CI/CD pipleline requiring tests to pass for deploy.

### Code Choices

- Functional VS OOP - I used more OOP principles as most of my experience has been in functional coding. 
- Documentation - I went a bit overboard with documentation both for practice and as I know from experience if you come back to somethign a year or two later, over documentation is far better than under. 
- No Mongoose - I have worked with Mongoose, but I wanted to get a better feel for MongoDB directly. If I did it again, I'd use Mongoose.
- JWT tokens VS Csrf - I had csrf but they were not working well with passportjs/express-sessions as the sessions were continually being recreated and the token lost. Switched to access/refresh tokens as they provide the same functionality without all the hassle.

## Where are we?

### Working (not feature complete, full design still in progress):

- Server runs and connects to MongoDB 
- User registration
- User Register/Login/logout flows
- JWT AccessToken, Helmet working
- Email Verification and password reset flows
- Schema Creation & Validation for Incoming, DB saves, and Outgoing data
- Recipe CRUD
- Cloudinary based image upload and deleting
- User and data Persistence
- Flows updated to add soft deletes for data to ensure public recipes are sharable and not lost
- Global Error Handler

### Working on Now:

- Deploy: 
    - Sanitize Middleware
    - run OWASP ZAP (or other security scanner)
    - Backups
   

### To Come:

- expand error handling together with FrontEnd responses
- setup retry-ables
- Redis (caching) & test DB Indexes are working
- Logging 
- Expand Validation (trim strings to be compared (names, email, inputs)), (toLowercase emails, usernames, capitalize on frontend if needed)
- organize schemas (duplicates? generify existing)
- Testing
- Look into OpenAPIdocs just to show jsDoc in structured format
- Recipe Search/ingredient auto complete
- Cron based softdeleted/unref'd recipe deletion (only if no user.recipes has ref'd), also if last user ref'ing, delete image in cloudinary
- User Admin (update/delete)
- integraton and E2E testing
- Google/Facebook login (maybe)

## Author

- **Ethan Strauss** - [Portfolio](https://dotethan.github.io)
