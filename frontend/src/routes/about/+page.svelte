<script lang="ts">
	import { resolveRoute } from '$app/paths';
</script>

<svelte:head>
	<title>About - Sheeta Cloud Services</title>
	<meta name="description" content="About Ian Cullinane" />
</svelte:head>

<div class="terminal-line">
	<span class="prompt">❯</span>
	<span class="command">cat about.md</span>
</div>
<div class="output">
	<h1>Ian Cullinane</h1>
	<h2>Cloud & Game Services Software Engineer</h2>
	<h3>DevOps too...</h3>

	<div class="content">
		<p>
			My name is Ian Cullinane. You can see my github <a href="https://www.github.com/iancullinane"
				>here</a
			>. My LinkedIn can be found
			<a href="https://www.linkedin.com/in/ian-cullinane-4b8a359a/">here</a>. For contracting,
			hosting, or general software consultation use LinkedIn or email me at
			<a href="mailto:ian@iancullinane.com">ian@iancullinane.com</a>
		</p>

		<p>
			For the last two years I have run the platform and deployment team for WB Games Boston on our
			hit game Game of Thrones: Conquest.
		</p>
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
		letter-spacing: -0.02em;
	}

	h2 {
		font-size: 1.1rem;
		font-weight: 500;
		color: #83a598;
		margin: 0 0 0.25rem 0;
	}

	h3 {
		font-size: 0.95rem;
		font-weight: 400;
		color: #8ec07c;
		margin: 0 0 1.5rem 0;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	p {
		color: #ebdbb2;
		line-height: 1.6;
		margin: 0;
	}

	a {
		color: #fe8019;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	a:hover {
		color: #fabd2f;
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 1.25rem;
		}

		h2 {
			font-size: 1rem;
		}

		h3 {
			font-size: 0.875rem;
		}

		.output {
			margin-left: 1rem;
		}
	}
</style>
