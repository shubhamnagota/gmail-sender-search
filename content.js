// Content script for Gmail Sender Search extension
// This script runs on all Gmail pages to help with sender detection

(function () {
	'use strict';

	// Function to extract sender information from the currently active email
	function extractCurrentSenderInfo() {
		// Wait for Gmail to load
		if (!document.querySelector('[role="main"]')) {
			return null;
		}

		// Strategy 1: Find the currently active/expanded email
		function findActiveEmailSender() {
			// Look for expanded message indicators
			const expandedSelectors = [
				// Expanded conversation message
				'.h7[aria-expanded="true"] span[email]',
				'.h7:not([style*="display: none"]) span[email]',
				// Single email view
				'.nH.if span[email]',
				// Currently selected message in conversation
				'.h7.acW span[email]',
				// Most recent message in thread
				'.h7:last-of-type span[email]',
			];

			for (const selector of expandedSelectors) {
				const element = document.querySelector(selector);
				if (element) {
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

		// Strategy 2: Look for sender in the main content area
		function findVisibleSender() {
			const mainContent = document.querySelector('[role="main"]');
			if (!mainContent) return null;

			const emailElements = mainContent.querySelectorAll('span[email], div[email], [data-hovercard-id*="@"]');

			for (const element of emailElements) {
				// Skip hidden elements
				if (element.offsetParent === null) continue;

				const email = element.getAttribute('email') || element.getAttribute('data-hovercard-id');
				if (email && email.includes('@') && !email.includes('noreply@gmail.com')) {
					const name =
						element.getAttribute('name') || element.getAttribute('title') || element.textContent?.trim() || '';

					return {
						email: email,
						name: name !== email ? name.replace(email, '').replace(/[<>]/g, '').trim() : '',
					};
				}
			}
			return null;
		}

		// Strategy 3: Parse from conversation headers
		function parseFromHeaders() {
			const headers = document.querySelectorAll('[data-hovercard-id], .go, .gD');
			for (const header of headers) {
				const text = header.textContent || '';
				const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
				if (emailMatch && !emailMatch[1].includes('noreply@gmail.com')) {
					const email = emailMatch[1];
					const name = text.replace(email, '').replace(/[<>]/g, '').trim();
					return { email, name };
				}
			}
			return null;
		}

		// Try strategies in order of preference
		return findActiveEmailSender() || findVisibleSender() || parseFromHeaders();
	}

	// Expose function for popup to use - always get fresh data
	window.gmailSenderSearchGetInfo = function () {
		console.log('Getting fresh sender info...');
		return extractCurrentSenderInfo();
	};

	// Also clear any cached data when URL changes (Gmail SPA navigation)
	let currentUrl = window.location.href;
	const urlObserver = new MutationObserver(() => {
		if (window.location.href !== currentUrl) {
			currentUrl = window.location.href;
			console.log('Gmail navigation detected, clearing cache');
		}
	});

	// Start observing URL changes
	if (document.body) {
		urlObserver.observe(document.body, { subtree: true, childList: true });
	}
})();
