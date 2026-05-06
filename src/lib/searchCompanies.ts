// get all companies in Torn City
// https://api.torn.com/torn/?selections=companies&key=wd2oPqZNGASHV5f4&comment=TryItPage
// get all companies in Torn City with ID 10(adult novelties)
// https://api.torn.com/company/10?selections=companies&key=wd2oPqZNGASHV5f4

import { sortDb } from '$lib/dbSort';

interface Company {
	ID: number;
	company_type: number;
	/** from 0 to 10 */
	rating: number;
	name: string;
	/** director userId */
	director: string;
	employees_hired: number;
	employees_capacity: number;
	daily_income: number;
	daily_customers: number;
	weekly_income: number;
	weekly_customers: number;
	days_old: number;
}

export interface SimpleCompany {
	id: number;
	rating: number;
	name: string;
	owner: string;
	lastMailed: Date | null;
	employeesHired: number;
	employeesCapacity: number;
	dailyIncome: number;
	daysOld: number;
}

type Companies = Record<string, Company>;

const updateDb = async (apiKey: string, companyType: number, dbCopy: SimpleCompany[] = []) => {
	try {
		const response = await fetch(
			`https://api.torn.com/company/${companyType}?selections=companies&key=${apiKey}`
		);
		const data: { company: Companies } = await response.json();

		const companies: SimpleCompany[] = [];
		for (const [id, company] of Object.entries(data.company)) {
			companies.push({
				id: Number(id),
				rating: company.rating,
				name: company.name,
				owner: company.director,
				lastMailed: null,
				employeesHired: company.employees_hired,
				employeesCapacity: company.employees_capacity,
				dailyIncome: company.daily_income,
				daysOld: company.days_old
			});
		}

		// add new companies to the db
		for (const company of companies) {
			if (!dbCopy.some((c) => c.id === company.id)) {
				dbCopy.push(company);
			}
		}
		// sort db by lastMailed, then by rating
		dbCopy.sort(sortDb);

		console.log(`Found ${companies.length} companies.`);

		return dbCopy;
	} catch (error) {
		console.error('Error fetching companies:', error);
		return dbCopy; // return the existing dbCopy if there's an error
	}
};

export const searchCompanies = async (
	apiKey: string,
	query: { companyType: number; minRating: number; maxRating: number; hasEmptySlots: boolean },
	dbCopy: SimpleCompany[] = []
) => {
	// dbCopy as parameter is useless for now
	const { companyType, minRating, maxRating, hasEmptySlots } = query;

	const lastUpdate = localStorage.getItem(`db-${query.companyType}-lastUpdate`);

	dbCopy = [];
	try {
		dbCopy = JSON.parse(localStorage.getItem(`db-${query.companyType}`) || '[]');
	} catch (e) {
		console.error('Error parsing localStorage db:', e);
	}

	if (
		!lastUpdate ||
		Date.now() - new Date(lastUpdate).getTime() > 5 * 60 * 1000 || // 5min
		dbCopy.length === 0
	) {
		dbCopy = await updateDb(apiKey, companyType, dbCopy);

		localStorage.setItem(`db-${query.companyType}-lastUpdate`, new Date().toISOString());
		localStorage.setItem(`db-${query.companyType}`, JSON.stringify(dbCopy));
	}

	dbCopy = dbCopy.filter((company) => {
		if (minRating && company.rating < minRating) return false;
		if (maxRating && company.rating > maxRating) return false;
		if (hasEmptySlots && company.employeesHired >= company.employeesCapacity) return false;
		return true;
	});

	return dbCopy;
};
