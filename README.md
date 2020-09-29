# Plastic Free World Petition

### Website

https://plastic-free-world.herokuapp.com

### Description

This was the first large project I completed at Spiced Academy. It is an online petition where supporters can register, log in, update profile information, provide their signature, delete or redo their signature, and view a list of fellow signatories.

### Technology

* Node/Express server
* Handelbars templates
* PostgreSQL database
* Testing with Jest and Supertest
* Deployed with AWS and Heroku

### Features

* Users create an account before signing the petition and are able to log in and out
* Users are invited to provide additional optional information: age, city, homepage
* A header partial greets the user by first name and renders menu items using a helper
* To protect users, the following security libraries are used: bcrypt.js, csurf middleware, DOMpurify
* After signing, users can see a list of all signers or signers by city
* If a homepage has been provided, users can visit it by clicking on a user's name
* Users can remove their signature, update their information, or delete their account
* Access to different pages is controlled by cookies

### Preview

! [] (petition.gif)