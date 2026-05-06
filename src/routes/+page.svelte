<script lang="ts">
	import { companiesIds } from '$lib/configs/companies';
	import { sortDb } from '$lib/dbSort';
	import { getStats } from '$lib/getStats';
	import Button from '$lib/components/inputs/Button.svelte';
	import TextField from '$lib/components/inputs/TextField.svelte';
	import { searchCompanies, type SimpleCompany } from '$lib/searchCompanies';
	import { onMount } from 'svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';

	import MdiShow from 'virtual:icons/mdi/show';
	import MdiHide from 'virtual:icons/mdi/hide';
	import MdiStar from 'virtual:icons/mdi/star';
	import MdiCopy from 'virtual:icons/mdi/content-copy';

	let db: SimpleCompany[] = $state([]);
	let apiKey = $state('');
	let messageOpen = $state(true);
	let configOpen = $state(true);
	let query = $state({
		minRating: 0,
		maxRating: 10,
		companyType: -1,
		hasEmptySlots: true
	});
	let message = $state({
		subject: '',
		body: ''
	});
	let stats = $state({
		man: 0,
		int: 0,
		end: 0,
		ee: 0
	});
	let isSubjectCopied = $state(false);
	let isBodyCopied = $state(false);

	onMount(() => {
		const storedApiKey = localStorage.getItem('apiKey');
		const storedMessageSubject = localStorage.getItem('messageSubject');
		const storedMessageBody = localStorage.getItem('messageBody');
		const storedStats = localStorage.getItem('stats');
		const storedQuery = localStorage.getItem('query');
		if (storedApiKey) {
			apiKey = storedApiKey;
		}
		if (storedMessageSubject) {
			message.subject = storedMessageSubject;
		}
		if (storedMessageBody) {
			message.body = storedMessageBody;
		}
		if (storedStats) {
			stats = JSON.parse(storedStats);
		}
		if (storedQuery) {
			query = JSON.parse(storedQuery);
		}

		const storedDb = localStorage.getItem(`db-${query.companyType}`);
		db = JSON.parse(storedDb || '[]');
	});

	$effect(() => {
		if (isBodyCopied) {
			setTimeout(() => {
				isBodyCopied = false;
			}, 3000);
		}
		if (isSubjectCopied) {
			setTimeout(() => {
				isSubjectCopied = false;
			}, 3000);
		}
	});
	$effect(() => {
		if (apiKey != '') {
			localStorage.setItem('apiKey', apiKey);
		}
	});
	$effect(() => {
		if (message.subject != '') {
			localStorage.setItem('messageSubject', message.subject);
		}
		if (message.body != '') {
			localStorage.setItem('messageBody', message.body);
		}
	});
	$effect(() => {
		localStorage.setItem('stats', JSON.stringify(stats));
	});
	$effect(() => {
		localStorage.setItem('query', JSON.stringify(query));
	});

	const copyToClipboard = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				console.log('Text copied to clipboard:', text);
			})
			.catch((err) => {
				console.error('Failed to copy text:', err);
			});
	};
	const parseBody = () => {
		let messageBody = message.body;

		messageBody = messageBody
			.replace('{man}', stats.man.toString())
			.replace('{int}', stats.int.toString())
			.replace('{end}', stats.end.toString())
			.replace('{ee}', stats.ee.toString())
			.replaceAll('\n', '\n\n');

		copyToClipboard(messageBody);
	};

	const openExternalLink = (link: string, redirect = true) => {
		const handle = window.open(link, '_blank', !redirect ? 'noopener,noreferrer' : '');
		if (!redirect) {
			window.blur();
			window.focus();
		}
	};

	const search = async () => {
		if (apiKey === '') {
			alert('Please enter your API key.');
			return;
		}

		// TODO: update periodically to avoid spamming the API
		const statsResponse = await getStats(apiKey);
		if (statsResponse) {
			stats = statsResponse;
		} else {
			alert('Failed to fetch stats. Please check your API key.');
			return;
		}

		const companiesResponse = await searchCompanies(apiKey, query, $state.snapshot(db));
		if (companiesResponse) {
			db = companiesResponse;
		} else {
			alert('Failed to fetch companies. Please check your API key and query parameters.');
			return;
		}
	};

	const markAsMailed = (companyId: number) => {
		const company = db.find((c) => c.id === companyId);
		if (company) {
			company.lastMailed = new Date(new Date().toISOString().split('T')[0]);
			db.sort(sortDb);
			localStorage.setItem(`db-${query.companyType}`, JSON.stringify(db));
		}
	};
</script>

<div class="flex h-full w-full flex-col">
	<div class="my-container flex flex-row flex-wrap items-center justify-between">
		<h1 class="mr-4 text-2xl font-semibold">TornJobs</h1>
		<div class="flex flex-row flex-wrap items-center">
			<div>
				Your API key(<Tooltip text="generate api key"
					><span
						role="button"
						tabindex="0"
						class="font-medium hover:cursor-pointer hover:underline"
						onclick={() => openExternalLink(`https://www.torn.com/preferences.php#tab=api`)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								openExternalLink(`https://www.torn.com/preferences.php#tab=api`);
							}
						}}
					>
						minimal</span
					></Tooltip
				>):
			</div>
			<TextField bind:value={apiKey} props={{ placeholder: 'Minimal access API key' }} />
		</div>
		<a class=" text-zinc-500" href="https://www.torn.com/profiles.php?XID=3718662">by Termained</a>
	</div>

	<fieldset class="my-container flex flex-row flex-wrap items-center gap-x-4">
		<legend>
			<Tooltip text="Click to show/hide config form">
				<div
					class="flex flex-row items-center gap-2 hover:cursor-pointer"
					onclick={() => (configOpen = !configOpen)}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							configOpen = !configOpen;
						}
					}}
				>
					Config <span>
						{#if configOpen}
							<MdiShow />
						{:else}
							<MdiHide />
						{/if}
					</span>
				</div>
			</Tooltip></legend
		>
		<div
			class="
					class={'ease flex flex-col overflow-hidden transition-all duration-500' +
				' ' +
				(configOpen ? 'h-40' : 'h-0 p-0')}"
		>
			<div class="flex flex-row items-center">
				<span class="shine mr-1 text-lg font-medium">Tutorial</span>
				<Tooltip
					textClassName="w-75"
					text={`To use the app, start by setting the type of company you want to check in the config - everything else is optional and up to you. You can then prepare your message to the directors; once you copy the body, your stats will automatically be filled in. At the bottom of the app, you'll find a list of companies. When you mark one as "mailed", it'll move to the bottom of the list - out of your way for now, but easy to come back to later :)`}
				/>
			</div>
			<div>
				Company type: <select bind:value={query.companyType}>
					{#each companiesIds as company}
						<option class="text-black" value={company.id}>{company.name}</option>
					{/each}
				</select>
			</div>
			<div>
				Min rating: <input
					bind:value={query.minRating}
					type="number"
					min="0"
					max={query.maxRating === 0 || !query.maxRating ? 10 : query.maxRating}
				/>
				<MdiStar class="inline-block" />
			</div>
			<div>
				Max rating: <input
					bind:value={query.maxRating}
					type="number"
					max="10"
					min={query.minRating}
				/><MdiStar class="inline-block" />
			</div>
			<div>Has empty slots: <input type="checkbox" bind:checked={query.hasEmptySlots} /></div>

			<div class="mt-2 flex w-full flex-row items-center gap-2">
				<Button className="text-xl" props={{ type: 'button', onclick: search }}>Search</Button>
				<!-- <Tooltip text="every time you change company" /> -->
			</div>
		</div>
	</fieldset>
	<fieldset class="my-container">
		<legend>
			<Tooltip text="Click to show/hide message form">
				<div
					class="flex flex-row items-center gap-2 hover:cursor-pointer"
					onclick={() => (messageOpen = !messageOpen)}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							messageOpen = !messageOpen;
						}
					}}
				>
					Message <span>
						{#if messageOpen}
							<MdiShow />
						{:else}
							<MdiHide />
						{/if}
					</span>
				</div>
			</Tooltip></legend
		>

		<div
			class={'ease flex flex-col overflow-hidden transition-all duration-500' +
				' ' +
				(messageOpen ? 'h-50' : 'h-0 p-0')}
		>
			<TextField
				bind:value={message.subject}
				props={{ type: 'text', placeholder: 'Subject - only for mails' }}
			/>
			<textarea
				class="mt-2 flex-1 p-1"
				bind:value={message.body}
				placeholder={`Write a message that you can copy later. You can use the {man}, {int}, {end} and {ee} tags,
				 which will be replaced with your real stats`}
			></textarea>
		</div>
		<div class="flex flex-row flex-wrap gap-1">
			<!-- <Button
				className="mr-4"
				props={{ onclick: () => (messageOpen = !messageOpen), type: 'button' }}
			>
				{messageOpen ? 'Hide' : 'Show'}
			</Button> -->
			<Button
				props={{
					type: 'button',
					onclick: () => {
						copyToClipboard(message.subject);
						isSubjectCopied = true;
					}
				}}
				>{isSubjectCopied ? 'Copied!' : 'Copy subject'}<MdiCopy class="ml-1 inline-block" /></Button
			>
			<Button
				className="ml-4"
				props={{
					type: 'button',
					onclick: () => {
						parseBody();
						isBodyCopied = true;
					}
				}}>{isBodyCopied ? 'Copied!' : 'Copy body'}<MdiCopy class="ml-1 inline-block" /></Button
			>
		</div>
	</fieldset>
	<fieldset class="my-container flex-1 overflow-y-scroll">
		<legend>Companies</legend>
		<div class="">
			{#if db.length === 0}
				<p class="text-center text-2xl">
					Add API key, change config and press search to see companies
				</p>
			{/if}
			{#each db as company}
				<div class="mb-2 rounded-lg bg-[#303030] px-4 py-2">
					<h4 class="flex flex-row flex-wrap items-center gap-1 text-xl">
						<span
							role="button"
							tabindex="0"
							class="mr-4 hover:cursor-pointer hover:underline"
							onclick={() =>
								openExternalLink(`https://www.torn.com/joblist.php#/p=corpinfo&ID=${company.id}`)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									openExternalLink(`https://www.torn.com/joblist.php#/p=corpinfo&ID=${company.id}`);
								}
							}}
							><span class="mr-1 font-medium">
								{@html company.name}
							</span>
							#{company.id}</span
						>
						<div class="flex flex-row items-center">
							{company.rating}<MdiStar />
						</div>
					</h4>
					<div class="flex flex-col sm:flex-row sm:gap-20">
						<div class="flex flex-col">
							<span
								role="button"
								tabindex="0"
								class="hover:cursor-pointer hover:underline"
								onclick={() =>
									openExternalLink(`https://www.torn.com/profiles.php?XID=${company.owner}`)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										openExternalLink(`https://www.torn.com/profiles.php?XID=${company.owner}`);
									}
								}}
							>
								Owner: {company.owner}</span
							>
							<p>Days old: {company.daysOld}</p>
						</div>
						<div class="flex flex-col">
							<p>Employees hired: {company.employeesHired} / {company.employeesCapacity}</p>
							<p>
								Last mailed:
								{#if !company.lastMailed}
									{'Never'}
								{:else}
									{new Date(company.lastMailed).toLocaleDateString()}
								{/if}
							</p>
						</div>
					</div>

					<p>Daily income: {company.dailyIncome.toLocaleString()}$</p>
					<!-- <Button
						className="mt-2"
						props={{
							type: 'button',
							onclick: () => {
								openExternalLink(
									`https://www.torn.com/joblist.php#/p=corpinfo&ID=${company.id}`,
									false
								);
							}
						}}>Apply</Button
					> -->
					<a
						class="mr-4 font-semibold hover:cursor-pointer hover:underline"
						onclick={(e) => {
							e.preventDefault();
							openExternalLink(
								`https://www.torn.com/joblist.php#/p=corpinfo&ID=${company.id}`,
								false
							);
						}}
						href={`https://www.torn.com/joblist.php#/p=corpinfo&ID=${company.id}`}>Apply</a
					>
					<a
						class="mr-4 font-semibold hover:cursor-pointer hover:underline"
						onclick={(e) => {
							e.preventDefault();
							openExternalLink(
								`https://www.torn.com/joblist.php#/p=corpinfo&ID=${company.id}`,
								false
							);
						}}
						href={`https://www.torn.com/messages.php#/p=compose&XID=${company.owner}`}>Mail</a
					>
					<Button
						props={{
							type: 'button',
							onclick: () => {
								markAsMailed(company.id);
							}
						}}>Mark as mailed</Button
					>
				</div>
			{/each}
		</div>
	</fieldset>
</div>

<style>
	.my-container {
		border: gray 2px solid;
		border-radius: 1rem;
		margin: 0.5rem 2rem;
		padding: 0.5rem 1rem;
		position: relative;
		background-color: #222222;
		--tw-shadow:
			0 4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)),
			0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
		box-shadow:
			var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow),
			var(--tw-ring-shadow), var(--tw-shadow);
	}
	.my-container > legend {
		font-size: 1.25rem;
		padding-inline: 0.5rem;
	}
	input,
	select {
		border-bottom: 1px solid white;
	}
	input[type='number'] {
		width: 4rem;
	}
	@keyframes shine {
		0% {
			background-position: -100%;
		}
		100% {
			background-position: 100%;
		}
	}
	.shine {
		animation: shine 1.75s linear infinite;
		background: linear-gradient(
			120deg,
			rgba(255, 255, 255, 0) 30%,
			rgba(255, 255, 255, 0.85) 50%,
			rgba(255, 255, 255, 0) 70%
		);
		background-size: 200%;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		text-shadow: 0 0 01px white;
	}
</style>
