# 📊 API Yield

A backend API built with **Node.js**, **JavaScript**, and **MongoDB** to manage financial asset returns, 
including dividends and performance tracking. The goal is to register and analyze income generated from investments.

---

## 💡 Why I built this project

As a professional volleyball athlete who relocates to a different country each year to play for new teams,  
I constantly deal with financial accounts across multiple banks, brokers, and currencies.  

After struggling to find an app that could manage my international finances the way I needed,  
I decided to build my own tailored solution — and that’s how this project started.

---

![Status](https://img.shields.io/badge/status-in%20development-yellow)  
![Tech](https://img.shields.io/badge/built%20with-Node.js-blue)  
![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow) 
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Technologies used

- [Node.js](https://nodejs.org/)  
- [Express](https://expressjs.com/)  
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)  
- [Mongoose (MongoDB)](https://mongoosejs.com/)  
- [dotenv](https://github.com/motdotla/dotenv)  
- [Nodemon](https://nodemon.io/)

---

## 📂 Project structure

```bash
src/
├── config/         # MongoDB connection setup
├── controllers/    # Endpoint logic
├── models/         # Mongoose schemas
├── routes/         # API routes
├── server.js       # App entry point

🧪 Features
Register financial assets

Brazilian and US stocks

Store dividend and valuation data

Store credit card statements

Calculate returns per asset

Query all assets or individual records

## 🔐 Data Security

The API was designed with data protection in mind.  
All sensitive information is **encrypted before being stored** in the MongoDB database,  
ensuring privacy, integrity, and compliance with best practices.

⚙️ Running the project locally
Requirements
Node.js and npm installed

MongoDB (local or via Atlas)

Steps
# Clone the repository
git clone https://github.com/RZB1414/api-Yield.git

cd api-Yield

# Install dependencies
npm install

# Create your .env file

# Start the development server
npm run dev


📄 Environment Variables
You must create your own .env file with the following keys:

DB_USER
DB_PASSWORD
JWT_SECRET
JWT_REFRESH_SECRET

🧑‍💻 Author
Developed by Renan Buiatti
📫 renanbuiatti14@gmail.com
🌐 LinkedIn www.linkedin.com/in/renan-buiatti-13787924a
📷 Instagram renanbuiatti
