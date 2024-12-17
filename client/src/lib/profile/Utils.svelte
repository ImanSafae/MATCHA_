<script context="module" lang="ts">
	import { httpGET } from "$lib/httpRequests";
	import zxcvbn from 'zxcvbn';
	
	export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
		let timeoutId: number;
		return function (...args: Parameters<T>): void {
			clearTimeout(timeoutId);
			timeoutId = window.setTimeout(() => {
				func(...args);
			}, delay);
		};
	}
	
	export async function searchAddress(query: string, setResults: (results: Array<{ display_name: string, address: any, lat: string, lon: string }>) => void) {
		try {
			if (query) {
				const response = await httpGET(`/search?q=${query}`);
				const results = await response.json();
				setResults(results);
			}
		} catch (error) {
			// console.error(`[SEARCH ADDRESS] Error: ${error}`);
		}
	}

	export function hasCityOrEquivalent(address: any): boolean {
		return !!(address.city || address.town || address.village || address.hamlet || address.province);
	}

	export function formatLocation(fullAddress: any) {
	if (!fullAddress) {
		return 'Localisation without address';
	}
	const locality = fullAddress.city || fullAddress.town || fullAddress.village || fullAddress.hamlet || fullAddress.neighbourhood || null;
	const suburb = fullAddress.neighbourhood || fullAddress.suburb || null;
	const quarter = fullAddress.cityblock || fullAddress.quarter || null;
	let address = null;
	if (!locality) {
		if (!fullAddress.country) {
			address = 'Localisation without address';
		} else {
			address = `${fullAddress.country}`;
		}
	}
	else if (!suburb || suburb === locality) {
		address = `${locality}, ${fullAddress.country}`;
	} else {
		if (quarter) {
		address = `${quarter}, ${suburb}, ${locality}, ${fullAddress.country}`;
		} else {
		address = `${suburb}, ${locality}, ${fullAddress.country}`;
		}
	}
	return address;
	}

	export function isPasswordValid(password: string) {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{9,}$/;
    let passwordStrength;
    let passwordFeedback; 
    if (!regex.test(password)) {
      passwordStrength = 0;
      passwordFeedback = "Password must include 9 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.";
    } else {
      const result = zxcvbn(password);
      passwordStrength = result.score;
      passwordFeedback = result.feedback.suggestions.length ? result.feedback.suggestions[0] : null;
    }
    return { passwordStrength: passwordStrength, passwordFeedback: passwordFeedback};
  }

  export function formatBirthDate(date: Date): string {
  	const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  	return date.toLocaleDateString('en-EN', options);
}
</script>