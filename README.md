 # MATCHA
Matcha is a school 42 project, and a web application designed to bring people together. From registration to real-time chat, this project covers all the essential features of a modern dating platform.


### Technologies used
- Frontend built with **SvelteKit**, as a single-page application
- Backend built with **Express.js**
- Database built with **PostgreSQL**

### Registration and account management
Users can register with their email, choose a unique username and a secure password which respects a set of rules. They must activate their account with a unique link sent via email.
In case of forgotten password, they can recover it thanks to an email-based reset functionality.
Passwords are hashed in the database.

### User Profiles
Customizable profiles with:
- Gender
- Sexual preferences
- Biography
- Tags (e.g., #NatureLover, #Foodie, #Fitness, etc)
- Up to 5 pictures, including one profile picture.
- Activity tracking: see who viewed or "liked" your profile
- Fame rating: a public metric showcasing user popularity
- Geolocation: automatically locate users via GPS or manual input
- When looking at someone else's profile, a user can see that person's onlone status, and if they're offline, see the date and hour of the last time they were online.

### Searching and browsing
- Smart suggestions: upon login, the user is redirected to a new homepage where they can browse profiles, suggested through an algorithm based on tags, location, fame rating, and preferences.
- Advanced search: the user can search profiles, and filter and sort the results by age, location, tags, and fame rating. The results will only include people who match the user's gender and sexual preferences (e.g. if the user is a hetereosexual woman, the results will only include heterosexual or bisexual men).

### Matching, liking and other social interactions
Show interest by "liking" profiles. Mutual likes create a "match", unlocking chat functionality.
User management: a feature on each user's profile page allows to block or report them as a fake account. Blocking them removes them from your interactions.

### Real-Time features: chat and notifications
Chat system: instant messaging for connected users, accessible from any page. In order to be able to chat with someone, one must be _matched_ with them, which means they mutually liked each other.
Notifications: real-time alerts for profile views, likes, messages, and new matches.
Both of these features use socket.io.

### Security
Secure practices:
    - Encrypted passwords.
    - Protected variables to prevent SQL injection and HTML/script injection.
    - Validations on all forms, user input and uploaded content.

### UI
The frontend is designed with different themes. A theme is randomly chosen every time the page is reloaded. A theme includes:
- the website's logo
- the landing page's background image
- the register page's image
- the log in page's image

### Database
In order the make the experience more dynamic, the database is filled upon launching with 500 fake profiles of actors and other celebrities.

### To launch
Copy .env on root folder - must be retrieved from us
Run ./launch.sh
Then to fill the database with fake profiles:
Run ./fill-db.sh

docker-compose down -v: Stops and removes the containers defined in your Docker Compose file + database.

docker exec -it matcha-server sh: Enter inside container
