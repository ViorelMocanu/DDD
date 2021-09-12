module.exports = {
  all: () => [{ slug: 'servicii' }],
  permalink: '/:slug/',
  data: ({ data }) => {
    return data;
  },
};
