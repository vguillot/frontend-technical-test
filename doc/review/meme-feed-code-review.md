# Why was the feed slow (or even impossible) to load?

After login, all meme pages were being requested at once, alongside all the comment pages for each of those memes.  
Additionally, for every meme and comment, a separate API call was made to fetch the author — even if that author had already been fetched previously.  
This led to an excessive number of API requests, overwhelming the frontend and backend, and making the application unresponsive.

## How was it solved?

- Only the first page of memes is now loaded on initial load.
- Infinite scroll has been implemented: when the user reaches the last or second-to-last meme, the next page is fetched.
- Comments are now loaded only when the user explicitly requests them by clicking on the arrow.
- Authors are cached locally using their ID, preventing duplicate API calls for the same user.
