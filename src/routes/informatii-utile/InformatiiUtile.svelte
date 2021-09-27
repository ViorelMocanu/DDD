<script>
  import BlogIndex from './blogindex.svelte';
  import BlogPost from './blogpost.svelte';
  export let data, helpers, request, settings; // data is mainly being populated from the @elderjs/plugin-markdown
  const { html, frontmatter } = data;

  //console.log('REQUEST = ', request);

  let component = BlogPost;
  if (request.template === 'BlogIndex') {
    component = BlogIndex;
  }
</script>

<svelte:component this={component} {settings} {data} {helpers} {request} />
