/** Тонкая обёртка над fetch с понятной ошибкой. */
export async function httpGetText(url: string): Promise<string> {
	const response = await fetch(url, {
		headers: {
			Accept: 'text/html,text/plain,text/csv,*/*',
		},
	});
	if (!response.ok) {
		throw new Error(`HTTP ${response.status} для ${url}`);
	}
	return response.text();
}

export async function httpGetJson(url: string): Promise<unknown> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status} для ${url}`);
	}
	return response.json();
}
