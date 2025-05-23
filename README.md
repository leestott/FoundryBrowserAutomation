# 🚀 Foundry Local & Browser Automation Demo

**A modern Electron desktop application that demonstrates the integration of Microsoft Foundry Local SDK for AI model inference with Playwright MCP (Model Context Protocol) for intelligent browser automation.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-29.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)
![Playwright](https://img.shields.io/badge/Playwright-1.52.0-orange.svg)

## ✨ What This App Does

This application showcases the powerful combination of local AI models and browser automation in a sleek, modern interface. It demonstrates how AI can intelligently control web browsers using natural language commands, making web automation accessible to both developers and non-technical users.

### 🎯 Key Capabilities

- **🤖 Local AI Integration**: Execute AI models locally using Microsoft Foundry Local SDK
- **🌐 Intelligent Browser Automation**: Control browsers with natural language using Playwright MCP
- **💬 Natural Language Commands**: Tell the browser what to do in plain English
- **📸 Visual Feedback**: Automatic screenshot capture and display
- **🎨 Modern UI**: Beautiful tabbed interface with dark/light mode support
- **📊 Real-time Monitoring**: Live logs and status indicators
- **🔧 Built-in Diagnostics**: Comprehensive testing and troubleshooting tools

## 🖼️ Application Interface

The application features a modern, tabbed interface with three main sections:

1. **AI Model Tab**: Configure and test AI model connections
2. **Browser Automation Tab**: Execute natural language browser commands
3. **Logs Tab**: Monitor real-time application activity

*Note: To see the application interface, run the app using the instructions below.*

## 🚀 Quick Start

### Prerequisites

- **Node.js v16+** and npm
- **Microsoft Foundry Local SDK** (optional - app includes fallback functionality)
- **Windows/macOS/Linux** (cross-platform support)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd electron-app
   ```

2. **Install dependencies** (automatically installs Playwright browsers)
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

That's it! The app will automatically set up everything needed and launch with a beautiful splash screen.

## 📋 How to Use

### 🤖 AI Model Testing
1. Navigate to the **AI Model** tab
2. Select a model from the dropdown (if Foundry Local is available)
3. Enter a prompt and click **Submit**
4. View the AI response in the interface

### 🌐 Browser Automation
1. Go to the **Browser Automation** tab
2. Try these example commands in the MCP prompt field:

   **Basic Navigation:**
   ```
   Go to microsoft.com and take a screenshot
   ```

   **Complex Interactions:**
   ```
   Navigate to github.com, search for "playwright", and screenshot the results
   ```

   **Content Extraction:**
   ```
   Visit wikipedia.org, search for "artificial intelligence", and take a screenshot of the article
   ```

3. Click **Run MCP Prompt** to execute
4. View screenshots and results in the interface

### 🔧 Testing & Diagnostics
- **Run MCP Test**: Click to run comprehensive browser automation tests
- **Diagnose MCP**: Check MCP installation and configuration
- **View Logs**: Monitor all application activity in real-time

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Launch the application with auto-setup |
| `npm test` | Run all automated tests |
| `npm run test:mcp` | Test Playwright MCP functionality |
| `npm run diagnose:mcp` | Diagnose MCP installation issues |
| `npm run fix:mcp` | Reinstall MCP components |
| `npm run package` | Build distributable packages |

## 🏗️ Architecture

### Core Components

```
├── main.js              # Electron main process & IPC handling
├── renderer.js          # UI logic & event handling
├── preload.js          # Secure IPC bridge
├── browser-automation.js # Playwright MCP integration
├── fallback-mcp.js     # Fallback automation (when MCP unavailable)
├── theme.js            # Dark/light mode & UI animations
└── tests/
    ├── mcp-test.js     # Comprehensive MCP testing
    └── find-mcp.js     # MCP diagnostics
```

### UI Structure

```
├── index.html          # Main application layout
├── styles.css          # Modern styling & animations
├── animation.css       # UI transition effects
└── splash.html         # Startup splash screen
```

## 🎨 Features Showcase

### 🌓 Theming
- **Automatic dark/light mode** based on system preferences
- **Manual theme toggle** with smooth transitions
- **Consistent color scheme** throughout the interface

### 📱 Responsive Design
- **Tabbed interface** for organized content
- **Card-based layout** with subtle shadows and rounded corners
- **Responsive controls** that adapt to window size

### ⚡ Performance
- **Lazy loading** of heavy components
- **Efficient IPC communication** between processes
- **Background processing** for non-blocking operations

### 🔒 Security
- **Context isolation** enabled in Electron
- **Secure IPC** communication via preload scripts
- **Sandboxed renderer** process

## 🧪 Testing

### Automated Tests

**Run all tests:**
```bash
npm test
```

**Test specific functionality:**
```bash
npm run test:mcp      # Test browser automation
npm run test:browser  # Test basic browser functionality
```

### Manual Testing Examples

Try these commands to test the application:

1. **Simple Navigation Test**
   ```
   Go to example.com and take a screenshot
   ```

2. **Search Test**
   ```
   Navigate to duckduckgo.com, search for "electron apps", take a screenshot
   ```

3. **Multi-step Test**
   ```
   Go to github.com, click on "Explore", then take a screenshot of the page
   ```

## 🚨 Troubleshooting

### Common Issues

**MCP Not Working?**
```bash
npm run diagnose:mcp  # Check MCP installation
npm run fix:mcp       # Reinstall MCP components
```

**Browser Won't Launch?**
```bash
npx playwright install  # Install browser binaries
```

**Connection Issues?**
- Ensure Foundry Local is running (if using AI features)
- Check firewall settings
- Verify network connectivity

### Getting Help

1. **Check the Logs tab** in the application for detailed error messages
2. **Run diagnostics** using `npm run diagnose:mcp`
3. **Check the console** output when running from terminal
4. **Review error messages** in the application interface

## 🔧 Advanced Configuration

### Custom Model Configuration
Edit the model dropdown options in `renderer.js` to add your preferred models.

### Browser Automation Settings
Modify browser launch options in `browser-automation.js` for specific requirements.

### UI Customization
Update `styles.css` and `animation.css` to customize the application appearance.

## 📦 Building & Distribution

**Create distributable packages:**
```bash
npm run package
```

This creates platform-specific packages in the `dist/` directory:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image  
- **Linux**: `.AppImage` portable app

## 🛡️ Security & Privacy

- **Local Processing**: All AI inference happens locally (no cloud dependency)
- **Secure Automation**: Browser automation runs in isolated contexts
- **No Data Collection**: Application doesn't collect or transmit user data
- **Open Source**: Full source code available for review

## 📚 Technologies Used

| Technology | Purpose | Version |
|------------|---------|---------|
| **Electron** | Desktop app framework | ^29.0.0 |
| **Playwright** | Browser automation | ^1.52.0 |
| **@playwright/mcp** | Natural language browser control | ^0.0.26 |
| **Node.js** | Runtime environment | 16+ |
| **Microsoft Foundry Local** | Local AI inference | Latest |

## 🎯 Use Cases

This application demonstrates several practical use cases:

- **🧪 AI Model Testing**: Quick testing of local AI models
- **🕷️ Web Scraping**: Automated data extraction from websites
- **🧑‍💻 Browser Testing**: Automated UI testing with natural language
- **📊 Monitoring**: Automated website monitoring and screenshot capture
- **🎓 Education**: Learning browser automation and AI integration
- **🚀 Prototyping**: Rapid prototyping of automation workflows

## 🔮 Future Enhancements

- **🤖 Advanced AI Integration**: Support for more AI providers
- **📝 Script Recording**: Record browser actions as reusable scripts
- **🔄 Workflow Builder**: Visual workflow creation interface
- **☁️ Cloud Integration**: Optional cloud AI model support
- **📱 Mobile Support**: Electron-based mobile app version

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the troubleshooting section** above
2. **Run the built-in diagnostics** (`npm run diagnose:mcp`)
3. **Review the application logs** in the Logs tab
4. **Open an issue** on GitHub with detailed information

---

**Built with ❤️ using Electron, Playwright, and Microsoft Foundry Local SDK**
