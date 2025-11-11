# Gemini Project: TCC 停车管理系统

## Project Overview

This project is a comprehensive parking management system named "TCC停车管理系统". It consists of three main components:

1.  **TCC Mini-program Backend**: A Node.js backend using the Express framework to provide API services for a WeChat mini-program. It appears to have features related to image processing, potentially for license plate recognition or parking space monitoring, indicated by the `opencv4nodejs` dependency.
2.  **System Management Backend**: A robust Node.js backend, also using the Express framework, which serves a web-based administration interface. It includes features for security, logging, and task scheduling.
3.  **System Management Frontend**: A modern single-page application built with Vue.js and Vite. It utilizes the Element Plus UI library for its interface components and ECharts for data visualization, suggesting a data-rich dashboard for system administration.

The entire system uses MongoDB as its database, with separate databases for the mini-program and the admin system.

## Architecture and Technologies

*   **TCC Mini-program Backend**:
    *   **Framework**: Express.js
    *   **Database**: MongoDB (with Mongoose)
    *   **Key Libraries**: `opencv4nodejs`, `jsonwebtoken`, `multer`
    *   **Testing**: Jest

*   **System Management Backend**:
    *   **Framework**: Express.js
    *   **Database**: MongoDB (with Mongoose)
    *   **Key Libraries**: `helmet`, `joi`, `winston`, `node-cron`
    *   **Testing**: Jest

*   **System Management Frontend**:
    *   **Framework**: Vue.js 3 with Vite
    *   **UI Library**: Element Plus
    *   **Routing**: Vue Router
    *   **State Management**: Pinia
    *   **Charting**: ECharts

## Building and Running the Project

### Prerequisites

*   Node.js and npm installed
*   MongoDB server running

### Installation

Before running the project for the first time, install the dependencies for each component:

```bash
# In the project root
npm install

# In the backend directory
cd backend
npm install

# In the System/backend directory
cd ../System/backend
npm install

# In the System/frontend directory
cd ../frontend
npm install
```

### Running the System

The project provides convenient scripts to start all services simultaneously.

**Using PowerShell (Recommended):**

1.  Open a PowerShell terminal in the project root directory.
2.  Run the following command:

    ```powershell
    powershell -ExecutionPolicy Bypass -File start-all.ps1
    ```

**Using Batch File:**

1.  Double-click the `start-all.bat` file in the project root directory.
2.  Alternatively, run it from the command line:

    ```cmd
    .\start-all.bat
    ```

### Stopping the System

To stop all running services, execute the `stop-all.bat` script in the project root:

```cmd
.\stop-all.bat
```

### Accessing the Services

Once the system is running, the different components can be accessed at the following URLs:

*   **TCC Mini-program Backend API**: `http://localhost:3001`
*   **System Management Backend API**: `http://localhost:5000`
*   **System Management Frontend**: `http://localhost:5002`

## Development Conventions

*   The project is split into clearly defined frontend and backend components.
*   Each component has its own `package.json` file, managing its own dependencies and scripts.
*   The backends follow a standard Node.js project structure, with `server.js` as the entry point.
*   The Vue.js frontend uses modern tooling (Vite) and follows best practices for component-based architecture.
*   Testing is done with Jest for the backends.
*   The use of `nodemon` in the development scripts (`dev`) for the backends allows for automatic server restarts during development.
