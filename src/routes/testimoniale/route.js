module.exports = {
  all: () => [{ slug: 'testimoniale' }],
  permalink: '/:slug/',
  data: ({ data }) => {
    return data;
  },
};
