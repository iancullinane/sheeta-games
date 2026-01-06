<script lang="ts">
	import { resolveRoute } from '$app/paths';
</script>

<svelte:head>
	<title>Static Data - Sheeta Cloud Services</title>
	<meta name="description" content="Managed static data deployments" />
</svelte:head>

<div class="terminal-line">
	<span class="prompt">❯</span>
	<span class="command">cat static-data.md</span>
</div>
<div class="output">
	<h1>Managed Static Data Deployments</h1>

	<div class="content">
		<p class="subtitle">
			Let designers choose their format, compile to machine readable. Deploy to the edge.
		</p>

		<div class="feature-list">
			<div class="feature">
				<span class="bullet">▸</span>
				<div class="feature-content">
					<strong>Designer-Friendly Formats</strong>
					<span>Work with spreadsheets or JSON - whatever your team prefers</span>
				</div>
			</div>

			<div class="feature">
				<span class="bullet">▸</span>
				<div class="feature-content">
					<strong>Type-Safe Compilation</strong>
					<span>Data compiles to validated, machine-readable formats</span>
				</div>
			</div>

			<div class="feature">
				<span class="bullet">▸</span>
				<div class="feature-content">
					<strong>Edge Deployment</strong>
					<span>Distributed globally for low-latency access</span>
				</div>
			</div>

			<div class="feature">
				<span class="bullet">▸</span>
				<div class="feature-content">
					<strong>Pre-Built Starters</strong>
					<span>Get started quickly with battle-tested format templates</span>
				</div>
			</div>
		</div>

		<p class="tagline">Let design be design. Let data be data.</p>
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
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #fabd2f;
		margin: 0 0 1.5rem 0;
		letter-spacing: -0.02em;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.subtitle {
		color: #83a598;
		font-size: 1.05rem;
		line-height: 1.6;
		margin: 0;
	}

	.feature-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 0.5rem 0;
	}

	.feature {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #1d2021;
		border: 1px solid #504945;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.feature:hover {
		background: #282828;
		border-color: #83a598;
		transform: translateX(4px);
	}

	.bullet {
		color: #83a598;
		font-weight: 600;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.feature-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.feature-content strong {
		color: #fabd2f;
		font-weight: 600;
	}

	.feature-content span {
		color: #a89984;
		font-size: 0.9rem;
	}

	.tagline {
		color: #8ec07c;
		font-style: italic;
		font-size: 1rem;
		margin: 0.5rem 0 0 0;
		text-align: center;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 1.25rem;
		}

		.subtitle {
			font-size: 0.95rem;
		}

		.output {
			margin-left: 1rem;
		}

		.feature {
			padding: 0.5rem 0.75rem;
		}
	}
</style>
