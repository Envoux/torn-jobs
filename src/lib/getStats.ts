export const getStats = async (apiKey: string) => {
	try {
		const lastUpdate = localStorage.getItem(`stats-lastUpdate`);

		// If the stats were updated less than 5 minutes ago, return cached stats
		if (lastUpdate && Date.now() - new Date(lastUpdate).getTime() < 5 * 60 * 1000) {
			const cachedStats = localStorage.getItem(`stats`);
			if (cachedStats) {
				return JSON.parse(cachedStats);
			}
		}
		const meritsResponse = await fetch(
			`https://api.torn.com/user/?selections=merits&key=${apiKey}`
		);
		const workStatsResponse = await fetch(
			`https://api.torn.com/user/?selections=workstats&key=${apiKey}`
		);

		const meritsData = await meritsResponse.json();
		const workStatsData = await workStatsResponse.json();

		const stats = {
			ee: meritsData.merits['Employee Effectiveness'] || 0,
			man: workStatsData['manual_labor'] || 0,
			int: workStatsData['intelligence'] || 0,
			end: workStatsData['endurance'] || 0
		};

		localStorage.setItem(`stats`, JSON.stringify(stats));
		localStorage.setItem(`stats-lastUpdate`, new Date().toISOString());

		return stats;
	} catch (error) {
		console.error('Error fetching stats:', error);
	}
};
