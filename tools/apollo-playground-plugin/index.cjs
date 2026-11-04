'use strict';

const { renderPlaygroundPage } = require('@apollographql/graphql-playground-html');

const defaultPlaygroundVersion = '1.7.42';

function ApolloServerPluginLandingPageGraphQLPlayground(options = Object.create(null)) {
  return {
    async serverWillStart() {
      return {
        async renderLandingPage() {
          return {
            html: renderPlaygroundPage({
              version: defaultPlaygroundVersion,
              ...options,
            }),
          };
        },
      };
    },
  };
}

module.exports = {
  ApolloServerPluginLandingPageGraphQLPlayground,
};
