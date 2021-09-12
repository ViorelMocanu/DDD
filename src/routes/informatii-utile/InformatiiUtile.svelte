<script>
  import BlogIndex from './BlogIndex.svelte';
  import BlogPost from './BlogPost.svelte';
  export let data, helpers, request, settings; // data is mainly being populated from the @elderjs/plugin-markdown
  const { html, frontmatter } = data;

  //console.log('data = ', data);
  //console.log('helpers = ', helpers);
  //console.warn('HELPER EXACT =', helpers.permalinks['informatii-utile']({ slug: 'informatii-utile' }));
  console.log('REQUEST = ', request);
  //console.log('settings = ', settings);

  let component = BlogPost;
  if (request.template === 'BlogIndex') {
    component = BlogIndex;
  }
</script>

<style>
</style>

<svelte:component this={component} {settings} {data} {helpers} {request} />
