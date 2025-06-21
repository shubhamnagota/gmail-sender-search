document.addEventListener('DOMContentLoaded', async function () {
	const loadingDiv = document.getElementById('loading');
	const contentDiv = document.getElementById('content');
	const errorDiv = document.getElementById('error');
	const senderEmailDiv = document.getElementById('senderEmail');
	const senderNameDiv = document.getElementById('senderName');
	const searchBtn = document.getElementById('searchBtn');
	const searchDomainBtn = document.getElementById('searchDomainBtn');
	const searchUnreadBtn = document.getElementById('searchUnreadBtn');
	const searchDomainUnreadBtn = document.getElementById('searchDomainUnreadBtn');
	const domainInfoDiv = document.getElementById('domainInfo');
	const domainNameDiv = document.getElementById('domainName');

	loadingDiv.style.display = 'block';

	try {
		// Get the active tab
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

		// Check if we're on Gmail
		if (!tab.url.includes('mail.google.com')) {
			throw new Error('This extension only works on Gmail. Please open Gmail first.');
		}

		// Always inject fresh content script and get current sender info
		const results = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			function: getSenderInfoFresh,
		});

		const senderInfo = results[0].result;

		if (!senderInfo || !senderInfo.email) {
			throw new Error(
				'Could not find sender information. Make sure you have an email open and try clicking on the sender name first.',
			);
		}

		// Extract domain from email
		const domain = senderInfo.email.split('@')[1];

		// Show sender info
		senderEmailDiv.textContent = senderInfo.email;
		senderNameDiv.textContent = senderInfo.name || 'No name available';

		// Show domain info
		domainNameDiv.textContent = '@' + domain;
		domainInfoDiv.style.display = 'block';

		// Update button text to be more specific
		searchDomainBtn.textContent = `Search All from @${domain}`;

		// Hide domain unread button for personal email domains
		const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
		if (personalDomains.includes(domain.toLowerCase())) {
			searchDomainBtn.style.display = 'none';
			searchDomainUnreadBtn.style.display = 'none';
			domainInfoDiv.style.display = 'none';
		}

		loadingDiv.style.display = 'none';
		contentDiv.style.display = 'block';

		// Add click handlers
		searchBtn.addEventListener('click', () => {
			performSearch(tab.id, senderInfo.email, 'sender');
		});

		searchDomainBtn.addEventListener('click', () => {
			performSearch(tab.id, domain, 'domain');
		});

		searchUnreadBtn.addEventListener('click', () => {
			performSearch(tab.id, senderInfo.email, 'unread');
		});

		searchDomainUnreadBtn.addEventListener('click', () => {
			performSearch(tab.id, domain, 'domain-unread');
		});
	} catch (error) {
		loadingDiv.style.display = 'none';
		errorDiv.textContent = error.message;
		errorDiv.style.display = 'block';
	}
});

async function performSearch(tabId, searchTerm, searchType) {
	try {
		let searchQuery = '';

		// Build search query based on type
		switch (searchType) {
			case 'sender':
				searchQuery = `from:${searchTerm}`;
				break;
			case 'domain':
				searchQuery = `from:@${searchTerm}`;
				break;
			case 'unread':
				searchQuery = `from:${searchTerm} is:unread`;
				break;
			case 'domain-unread':
				searchQuery = `from:@${searchTerm} is:unread`;
				break;
		}

		// Navigate to search results
		await chrome.scripting.executeScript({
			target: { tabId },
			function: navigateToSearch,
			args: [searchQuery],
		});

		// Close popup
		window.close();
	} catch (error) {
		const errorDiv = document.getElementById('error');
		errorDiv.textContent = 'Failed to perform search: ' + error.message;
		errorDiv.style.display = 'block';
	}
}

// This function runs fresh each time to get current sender info
function getSenderInfoFresh() {
	console.log('Getting fresh sender info from current page...');

	// Wait a moment for any pending Gmail updates
	return new Promise((resolve) => {
		setTimeout(() => {
			const senderInfo = extractCurrentSender();
			console.log('Found sender info:', senderInfo);
			resolve(senderInfo);
		}, 100);
	});

	function extractCurrentSender() {
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

			// Get all potential sender elements
			const senderElements = mainContent.querySelectorAll('span[email], [data-hovercard-id*="@"]');

			// Filter to visible elements and valid emails
			for (const element of senderElements) {
				if (element.offsetParent === null) continue; // Skip hidden elements

				const email = element.getAttribute('email') || element.getAttribute('data-hovercard-id');
				if (email && email.includes('@') && !email.includes('noreply@gmail.com') && !email.includes('bounce@')) {
					let name = element.getAttribute('name') || element.getAttribute('title') || element.textContent?.trim() || '';

					// Clean up name
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

		// Try strategies in order
		return findActiveEmail() || findVisibleSender() || parseFromText();
	}
}

// This function runs in the Gmail page context
function getSenderInfo() {
	// First, try to find the currently active/selected email
	function findActiveEmail() {
		// Look for the currently selected/active email in different Gmail views
		const activeSelectors = [
			// Conversation view - look for the expanded/active message
			'.h7[data-message-id]:not([style*="display: none"]) span[email]',
			'.ii.gt .go span[email]', // Classic expanded message
			'.adn.ads .go span[email]', // Another expanded message format
			// Single email view
			'.nH.if span[email]',
			// Look for the topmost visible email in conversation
			'.h7:first-of-type span[email]',
			// Fallback to any visible sender
			'span[email]:not([style*="display: none"])',
		];

		for (const selector of activeSelectors) {
			const element = document.querySelector(selector);
			if (element) {
				const email = element.getAttribute('email');
				if (email && email.includes('@') && !email.includes('noreply@gmail.com')) {
					return element;
				}
			}
		}
		return null;
	}

	// Try to find the active email first
	let senderElement = findActiveEmail();

	// If no active email found, try broader search
	if (!senderElement) {
		const selectors = [
			// Look in the main content area for any sender
			'[role="main"] span[email]',
			'[data-thread-perm-id] span[email]',
			// Gmail's various layout selectors
			'.adn span[email]',
			'.bog span[email]',
			'.go span[email]',
			'.gD span[email]',
			// Hovercard elements
			'[data-hovercard-id*="@"]',
		];

		for (const selector of selectors) {
			const elements = document.querySelectorAll(selector);
			for (const element of elements) {
				const email = element.getAttribute('email') || element.getAttribute('data-hovercard-id');
				if (email && email.includes('@') && !email.includes('noreply@gmail.com')) {
					// Skip if this element is hidden
					if (element.offsetParent === null) continue;

					senderElement = element;
					break;
				}
			}
			if (senderElement) break;
		}
	}

	// Last resort: parse from visible text
	if (!senderElement) {
		const textElements = document.querySelectorAll('[role="main"] div, [role="main"] span');
		for (const element of textElements) {
			const text = element.textContent || '';
			const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
			if (emailMatch && !emailMatch[1].includes('noreply@gmail.com')) {
				return {
					email: emailMatch[1],
					name: text.replace(emailMatch[1], '').replace(/[<>]/g, '').trim(),
				};
			}
		}
	}

	if (!senderElement) {
		return null;
	}

	const email = senderElement.getAttribute('email') || senderElement.getAttribute('data-hovercard-id');
	let name =
		senderElement.getAttribute('name') ||
		senderElement.getAttribute('title') ||
		senderElement.textContent?.trim() ||
		'';

	// Clean up name (remove email if it's duplicated)
	if (name === email || name.includes(email)) {
		name = name.replace(email, '').replace(/[<>]/g, '').trim();
	}

	return {
		email: email,
		name: name,
	};
}

// This function runs in the Gmail page context to perform search
function navigateToSearch(searchQuery) {
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
