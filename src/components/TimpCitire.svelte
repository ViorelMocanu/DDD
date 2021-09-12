<script>
  export let textOriginal;
  const wordsperminute = 225;
  const words = textOriginal.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsperminute);
</script>

<span>{time}</span>
