# 📊 API Yield

A backend API built with **Node.js**, **TypeScript**, and **MongoDB** to manage financial asset returns, 
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
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)  
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Technologies used

- [Node.js](https://nodejs.org/)  
- [Express](https://expressjs.com/)  
- [TypeScript](https://www.typescriptlang.org/)  
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
├── server.ts       # App entry point

🧪 Features
Register financial assets

Store dividend and valuation data

Calculate returns per asset

Query all assets or individual records

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

# Create your .env file based on the example
cp .env.example .env

# Edit the .env file with your MongoDB connection string
# Example:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/yield

# Start the development server
npm run dev


📄 Environment Variables
You must create your own .env file with the following keys:

ini
Copiar
Editar
MONGO_URI=your_mongodb_connection_string
PORT=3000

🧑‍💻 Author
Developed by Renan Buiatti
📫 renan@email.com
🌐 LinkedIn
