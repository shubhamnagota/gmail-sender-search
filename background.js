// Background service worker for Gmail Sender Search extension
// Handles keyboard shortcuts

chrome.commands.onCommand.addListener(async (command) => {
	console.log('Command received:', command);

	try {
		// Get the active tab
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

		// Check if we're on Gmail
		if (!tab.url.includes('mail.google.com')) {
			console.log('Not on Gmail, ignoring command');
			return;
		}

		// Get sender info from the current page
		const results = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			function: extractSenderInfo,
		});

		const senderInfo = results[0].result;

		if (!senderInfo || !senderInfo.email) {
			console.log('No sender info found');
			return;
		}

		const domain = senderInfo.email.split('@')[1];
		let searchQuery = '';

		// Build search query based on command
		switch (command) {
			case 'search-by-sender':
				searchQuery = `from:${senderInfo.email}`;
				break;
			case 'search-by-domain':
				searchQuery = `from:@${domain}`;
				break;
			default:
				console.log('Unknown command:', command);
				return;
		}

		// Execute the search
		await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			function: performGmailSearch,
			args: [searchQuery],
		});
	} catch (error) {
		console.error('Error executing command:', error);
	}
});

// Function to extract sender info (runs in Gmail page context)
function extractSenderInfo() {
	// Wait a moment for any pending Gmail updates
	return new Promise((resolve) => {
		setTimeout(() => {
			const senderInfo = getCurrentSender();
			resolve(senderInfo);
		}, 100);
	});

	function getCurrentSender() {
		// Strategy 1: Look for the currently active/expanded email
		function findActiveEmail() {
			const activeSelectors = [
				// Expanded message in conversation view
				'.h7[aria-expanded="true"] span[email]',
				'.h7:not([style*="display: none"]) span[email]',
				// Single email view
				'.nH.if span[email]',
				// Currently selected/focused message
				'.h7.acW span[email]',
				// Most recent visible message
				'.h7:last-of-type:not([style*="display: none"]) span[email]',
				// Any visible message in main content
				'[role="main"] .h7 span[email]:not([style*="display: none"])',
			];

			for (const selector of activeSelectors) {
				const element = document.querySelector(selector);
				if (element && element.offsetParent !== null) {
					const email = element.getAttribute('email');
					if (email && email.includes('@') && !email.includes('noreply@gmail.com')) {
						return {
							email: email,
							name: element.getAttribute('name') || element.textContent?.trim() || '',
						};
					}
				}
			}
			return null;
		}

		// Strategy 2: Look for any visible sender in main content
		function findVisibleSender() {
			const mainContent = document.querySelector('[role="main"]');
			if (!mainContent) return null;

			const senderElements = mainContent.querySelectorAll('span[email], [data-hovercard-id*="@"]');

			for (const element of senderElements) {
				if (element.offsetParent === null) continue;

				const email = element.getAttribute('email') || element.getAttribute('data-hovercard-id');
				if (email && email.includes('@') && !email.includes('noreply@gmail.com') && !email.includes('bounce@')) {
					let name = element.getAttribute('name') || element.getAttribute('title') || element.textContent?.trim() || '';

					if (name === email || name.includes(email)) {
						name = name.replace(email, '').replace(/[<>]/g, '').trim();
					}

					return { email, name };
				}
			}
			return null;
		}

		// Strategy 3: Parse from text content
		function parseFromText() {
			const textContainers = document.querySelectorAll('[role="main"] .go, [role="main"] .gD, [role="main"] .bog');
			for (const container of textContainers) {
				if (container.offsetParent === null) continue;

				const text = container.textContent || '';
				const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
				if (emailMatch && !emailMatch[1].includes('noreply@gmail.com')) {
					const email = emailMatch[1];
					const name = text.replace(email, '').replace(/[<>]/g, '').trim();
					return { email, name };
				}
			}
			return null;
		}

		return findActiveEmail() || findVisibleSender() || parseFromText();
	}
}

// Function to perform Gmail search (runs in Gmail page context)
function performGmailSearch(searchQuery) {
	console.log('Performing search:', searchQuery);

	// Method 1: Try using Gmail's search box
	const searchBox =
		document.querySelector('input[aria-label="Search mail"]') ||
		document.querySelector('input[placeholder*="Search"]') ||
		document.querySelector('input[gh="gs"]');

	if (searchBox) {
		searchBox.value = searchQuery;
		searchBox.focus();

		// Trigger search by dispatching events
		searchBox.dispatchEvent(new Event('input', { bubbles: true }));
		searchBox.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Enter',
				keyCode: 13,
				bubbles: true,
			}),
		);

		// Backup: click search button if available
		setTimeout(() => {
			const searchButton =
				document.querySelector('button[aria-label="Search Mail"]') || document.querySelector('button[gh="sb"]');
			if (searchButton) {
				searchButton.click();
			}
		}, 100);
	} else {
		// Method 2: Navigate directly using URL
		const encodedQuery = encodeURIComponent(searchQuery);
		const searchUrl = `https://mail.google.com/mail/u/0/#search/${encodedQuery}`;
		window.location.href = searchUrl;
	}
}
