<script>
	export let textOriginal;
	const wordsperminute = 225;
	const words = textOriginal ? textOriginal.trim().split(/\s+/).length : 0;
	const time = Math.ceil(words / wordsperminute);
</script>

<span>{time}</span>
