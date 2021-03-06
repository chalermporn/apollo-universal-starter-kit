import React, { Component } from 'react';
import { getOperationAST } from 'graphql';
import { ApolloProvider } from 'react-apollo';
import { createStore, combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import { createApolloFetch } from 'apollo-fetch';
import BatchHttpLink from 'apollo-link-batch-http';
import { ApolloLink } from 'apollo-link';
import WebSocketLink from 'apollo-link-ws';
import { LoggingLink } from 'apollo-logger';
import InMemoryCache from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';

import modules from '../client/modules';
import MainScreenNavigator from '../client/app/Routes';
import settings from '../../settings';

const fetch = createApolloFetch({ uri: __BACKEND_URL__ });
const cache = new InMemoryCache();

const wsUri = __BACKEND_URL__.replace(/^http/, 'ws');
let link = ApolloLink.split(
  operation => {
    const operationAST = getOperationAST(operation.query, operation.operationName);
    return !!operationAST && operationAST.operation === 'subscription';
  },
  new WebSocketLink({
    uri: wsUri,
    options: {
      reconnect: true
    }
  }),
  new BatchHttpLink({ fetch })
);

const client = new ApolloClient({
  link: ApolloLink.from((settings.apolloLogging ? [new LoggingLink()] : []).concat([link])),
  cache
});

const store = createStore(
  combineReducers({
    form: formReducer,

    ...modules.reducers
  }),
  {} // initial state
);

export default class Main extends Component {
  render() {
    return (
      <ApolloProvider store={store} client={client}>
        <MainScreenNavigator />
      </ApolloProvider>
    );
  }
}
