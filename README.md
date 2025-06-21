# Gmail Sender Search Extension

A Chrome extension that lets you instantly search for all emails from the sender of your currently viewed Gmail message. Perfect for quickly finding related emails, checking company communications, or managing your inbox more efficiently.

## 🚀 Features

- **One-click sender search** - Search all emails from the current sender
- **Domain-wide search** - Find all emails from a company/organization
- **Unread filtering** - Focus on unread emails only
- **Keyboard shortcuts** - Lightning-fast searches with hotkeys
- **Smart sender detection** - Works with Gmail's conversation view and single emails
- **Clean, intuitive interface** - Matches Gmail's design language

## ⌨️ Keyboard Shortcuts

- `Alt+Shift+S` (Option+Shift+S on Mac) - Search all emails from current sender
- `Alt+Shift+D` (Option+Shift+D on Mac) - Search all emails from current sender's domain

## 📋 Installation

### Install from Chrome Web Store

_(Coming soon)_

### Install from Source

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/gmail-sender-search.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension directory
5. The extension will appear in your Chrome toolbar

## 🎯 How to Use

### Using the Popup Interface

1. Open any email in Gmail
2. Click the Gmail Sender Search extension icon in your toolbar
3. Choose your search option:
   - **Search All Emails from This Sender** - Find all emails from the current sender
   - **Search All from @domain.com** - Find all emails from the sender's domain
   - **Unread Only** - Search for unread emails from the sender
   - **Domain Unread** - Search for unread emails from the domain

### Using Keyboard Shortcuts

1. Open any email in Gmail
2. Press:
   - `Alt+Shift+S` to search by sender
   - `Alt+Shift+D` to search by domain
3. Results appear instantly in Gmail search

## 🛠️ Technical Details

### Built With

- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No external dependencies
- **Gmail DOM parsing** - Robust sender detection across Gmail layouts

### File Structure

```
gmail-sender-search/
├── manifest.json          # Extension configuration
├── content.js            # Gmail page interaction
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── background.js        # Keyboard shortcut handling
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Permissions Required

- `activeTab` - Access to current Gmail tab
- `scripting` - Execute scripts in Gmail pages
- `mail.google.com/*` - Gmail domain access

## 🔧 Development

### Prerequisites

- Chrome browser
- Basic knowledge of JavaScript and Chrome extensions

### Local Development

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh button on the extension card
4. Test your changes in Gmail

### Testing

- Test with different Gmail layouts (conversation view, single email)
- Test with various email formats (personal, business, automated)
- Verify keyboard shortcuts work across different Gmail views

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

- Follow existing code style
- Test changes across different Gmail layouts
- Update documentation for new features
- Ensure keyboard shortcuts don't conflict with Gmail/browser shortcuts

## 📝 Changelog

### v1.0.0 (Current)

- Initial release
- Basic sender and domain search functionality
- Keyboard shortcuts support
- Unread email filtering
- Smart sender detection

## 🐛 Known Issues

- Very rarely, sender detection may not work with heavily customized Gmail themes
- Extension requires Gmail to be fully loaded before use

## 💡 Future Features

- [ ] Search history
- [ ] Custom search filters
- [ ] Bulk actions on search results
- [ ] Integration with Gmail labels
- [ ] Export search results
- [ ] Set keyboard shortcuts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for faster Gmail workflows
- Built for productivity enthusiasts and email power users

## 📞 Support

If you encounter any issues or have suggestions:

- Open an issue on GitHub
- Email: [shubham.nagota@gmail.com]

---

**⭐ If this extension saves you time, please star the repository!**
