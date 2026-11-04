'use client';

import { HttpLink } from '@apollo/client';
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';

import { ENV } from '@/config/env';

const makeClient = () => {
  const httpLink = new HttpLink({
    uri: ENV.GRAPHQL_URL,
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
  });
};

export const ApolloWrapper = ({ children }: { children: React.ReactNode }) => {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
};
