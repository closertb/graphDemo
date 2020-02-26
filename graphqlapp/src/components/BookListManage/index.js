import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import TabBar from './TabBar';
import Content from './Content';

const GET_STATUS = gql`
  {
    readStatus @client
  }
`;

const BookList = () => (
  <Query query={GET_STATUS}>
    {({ data: { readStatus } }) => (
      <div>
        <TabBar status={readStatus} />
        <Content status={readStatus} />
      </div>
    )}
  </Query>
);
export default BookList;
