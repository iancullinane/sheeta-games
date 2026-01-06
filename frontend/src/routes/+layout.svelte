<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fira+Code:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app">
	<div class="terminal-container">
		<div class="terminal-window">
			<div class="terminal-header">
				<div class="terminal-buttons">
					<span class="btn-close"></span>
					<span class="btn-minimize"></span>
					<span class="btn-maximize"></span>
				</div>
				<div class="terminal-title">sheeta@cloud:~</div>
			</div>
			<main class="terminal-body">
				{@render children()}
			</main>
			<footer class="terminal-footer">
				<div class="terminal-line">
					<span class="prompt">❯</span>
					<a href="/" class="nav-button">Home</a>
					<a href="/about" class="nav-button">About</a>
					<span class="footer-text">Ian Cullinane © 2024</span>
				</div>
			</footer>
		</div>
	</div>
</div>

<style>
	:global(body) {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: #000000;
	}

	.terminal-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 2rem;
		box-sizing: border-box;
	}

	.terminal-window {
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		background: #282828;
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.terminal-header {
		background: #3c3836;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		border-bottom: 1px solid #504945;
		flex-shrink: 0;
	}

	.terminal-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.terminal-buttons span {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: block;
	}

	.btn-close {
		background: #fb4934;
	}

	.btn-minimize {
		background: #fabd2f;
	}

	.btn-maximize {
		background: #b8bb26;
	}

	.terminal-title {
		font-size: 0.875rem;
		color: #a89984;
		font-weight: 500;
	}

	main.terminal-body {
		flex: 1;
		padding: 1.5rem;
		color: #ebdbb2;
		font-size: 0.95rem;
		line-height: 1.6;
		width: 100%;
		max-width: 100%;
		margin: 0;
		box-sizing: border-box;
	}

	.terminal-footer {
		background: #282828;
		padding: 1rem 1.5rem;
		border-top: 1px solid #504945;
		flex-shrink: 0;
	}

	.terminal-line {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.prompt {
		color: #83a598;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.footer-text {
		color: #a89984;
		font-size: 0.875rem;
	}

	.nav-button {
		color: #83a598;
		text-decoration: none;
		font-size: 0.875rem;
		padding: 0.25rem 0.75rem;
		border: 1px solid #83a598;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.nav-button:hover {
		background: #83a598;
		color: #282828;
	}

	@media (max-width: 768px) {
		.terminal-container {
			padding: 1rem;
		}

		main.terminal-body {
			padding: 1rem;
			font-size: 0.85rem;
		}
	}
</style>
