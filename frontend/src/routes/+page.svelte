<script lang="ts">
	import { resolveRoute } from '$app/paths';
</script>

<svelte:head>
	<title>Sheeta Cloud Services</title>
	<meta
		name="description"
		content="Sheeta Cloud Services - Infrastructure and deployment solutions"
	/>
</svelte:head>

<div class="terminal-line">
	<span class="prompt">❯</span>
	<span class="command">runme sheeta.md</span>
</div>
<div class="output">
	<h1>Sheeta</h1>
	<h2>Cloud and DevOps experts with decades of experience working in games at scale.</h2>
	<br />
	<div class="services-list">
		<a href={resolveRoute('/static-data')} class="service-item">
			<span class="icon">▸</span>
			<span class="text">Static Data Management & Deployment</span>
		</a>
	</div>
</div>

<style>
	.terminal-line {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.prompt {
		color: #83a598;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.command {
		color: #8ec07c;
		font-weight: 500;
	}

	.output {
		margin-left: 2rem;
		margin-top: 1rem;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #fabd2f;
		/*margin: 0 0 1.5rem 0;*/
		letter-spacing: -0.02em;
		text-align: left;
	}

	.services-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.service-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #1d2021;
		border: 1px solid #504945;
		border-radius: 6px;
		transition: all 0.2s ease;
		cursor: pointer;
		text-decoration: none;
	}

	.service-item:hover {
		background: #282828;
		border-color: #83a598;
		transform: translateX(4px);
	}

	.service-item .icon {
		color: #83a598;
		font-weight: 600;
	}

	.service-item .text {
		color: #ebdbb2;
		font-weight: 400;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 1.25rem;
		}

		.output {
			margin-left: 1rem;
		}
	}
</style>
