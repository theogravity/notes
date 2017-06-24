# GraphQL Quick-Start Guide

The following uses Apollo tooling. Apollo was chosen because it was easy to develop with using their tooling compared to Relay Classic. 

https://www.apollodata.com/

https://www.codazen.com/choosing-graphql-client-apollo-vs-relay/

## Prerequisites

- You should be familiar with setting up a node.js server / babel transpiling / bundling (if necessary)
- Read the basics of how GraphQL queries / types work - http://graphql.org/learn/
  - If you're a bit unclear on either, the guide will hopefully show how it works and fits together
- ES6 usage - uncommonly used ES6 elements are clarified in the examples
  
# Server-Side Development

Goal: Understand what server-side development / structure is like.

This does not cover:

- Defining a database and its accessors. You will not have a working server without implementing some kind of database / mock layer using this guide.
  - I personally recommend http://knexjs.org/ and http://vincit.github.io/objection.js/ for setting up a database
  - Alternatively, you can define an in-memory database, using arrays/variables to store data

Resources used:

http://dev.apollodata.com/tools/

https://github.com/Akryum/apollo-server-example

https://github.com/apollographql/apollo-server-tutorial

## Required libraries

- graphql - facebook graphql library
- graphql-server-express - Apollo-developed 
- graphql-tools - Apollo-developed server tooling
- cors
- body-parser
- express

## Directory structure

At the time of this writing, I'm unsure what the official directory structure should be. I organized items into what I thought made sense while I was learning this. 

Each item will be explained in the guide.

```
├── schema/
│   ├── item/
│   │   ├── item.type.js
│   │   └── item.resolvers.js
│   ├── user/
│   │   ├── user.type.js
│   │   └── user.resolvers.js
│   ├── root-query/
│   │   ├── root-query.type.js
│   │   └── root-query.resolvers.js
│   ├── resolvers.js
│   └── schema.js
├── app.js
└── package.json
```

## Setting up the GraphQL server

```javascript
// app.js

import express from 'express'
import cors from 'cors'
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express'
import bodyParser from 'body-parser'

// GraphQL Schema is imported here
const graphQLSchema = `...`

// enable cors support
app.use('*', cors({
  origin: '*'
}))

// graphQL endpoint
app.use('/graphql', bodyParser.json(), graphqlExpress({ schema: graphQLSchema }))

// graphQL console
if (process.env.NODE_ENV === 'development') {
  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql'
  }))
}

app.listen(3000, () => {
  console.log(`Ready in ${Date.now() - start} ms!`)
  console.log('Listening on http://localhost:3000/')
})
```

## Defining the Schema

http://graphql.org/learn/schema/

### Define Types
 
```javascript
// schema/item/item.type.js

const ItemType = `
  type Item {
    # Item identifier
    id: ID!
    # Item name
    name: String!
    # Item description
    desc: String
    # Owner of the item
    owner: User
  }
`

export default ItemType
```

### Define Root-Level Query Type
 
A root-level query is defined just like any other type, but they are used as the main entrypoint into a GraphQL query.
 
#### Example
 
To query for an item and get a list of items at the same time, we might perform the following query:

```graphQL
query {
  item (id: 1) {
    name
  }
  items {
    id
    name
  }
}
```
 
In this situation, we have two main entrypoints:
 
- `item` (get a single item)
- `items` (get all item)
 
*Note: You can name the entrypoint whatever you want, some people might use `getItem` or `getItems`, 
but the convention seems to just be the object name itself for reading items.*
 
In order to expose these entrypoints, we'll define the following:
 
```javascript
// schema/root-query/root-query.type.js

const queryEntrypoints = `
  type RootQuery {
    # get an item
    item(id: String!): Item,
    # returns an array of items
    items: [Item]
  }
`

export default queryEntryPoints
```

*Note: the name of the type (RootQuery in this example), can be named anything you want.*

### Define Resolvers

Resolvers perform lookups on the fields of a type when that field is being requested and the data is unavailable.
 
#### Implement the `RootQuery` resolvers
 
In the sample query above, GraphQL will be looking at the `RootQuery` for an `item` and `items` field.

For each field, we will need to define a resolver.

http://dev.apollodata.com/tools/graphql-tools/resolvers.html#Resolver-function-signature

```javascript
// schema/root-query/root-query.resolvers.js

// must match the field items in RootQuery
const rootQueryResolvers = {
  // this is the resolver for RootQuery.item
  // the first param represents the parent object, which in this case, would be the RootQuery
  // the second param is incoming parameters 
  async item (rootObj, { id }) {
    // returns an object that matches the ItemType fields
    return await getItem(id)
  },
  // this is the resolver for RootQuery.items
  async items () {
    // would return an array of Item
    return await getItems()
  }
}

export default rootQueryResolvers
```

#### Implement the `Item` resolvers

Let's assume we have the following incoming query, which requests the following:

- The name of the item
- The item owner's username

```graphQL
query {
  item (id: 1) {
    name
    owner {
       username
    }
  }
}
```

In order to return the data back:

- GraphQL calls the `RootQuery#item()` resolver
- `getItem(id)` implemented in `RootQuery#item()` would be defined to a database fetch for the item using the `id`
- The database returns something like the following, which `RootQuery#item()` will return

```javascript
{
  id: 1,
  name: 'Test Item',
  description: 'This is a test item',
  ownerId: 234
}
```

- GraphQL attempts to map the object properties to the `Item` type (since the field `RootQuery.item` returns an `Item`)
- GraphQL notices `owner` is missing from the returned data
- GraphQL will now call a resolver for `Item.owner` to get back a user


```javascript
// schema/item/item.resolvers.js

// must match the field names in the Item type for field data 
// that cannot be obtained at the parent level (eg RootQuery#item())
// meaning not every field needs a resolver implementation
const itemResolvers = {
  // this is the resolver for Item.owner
  // the first param represents the parent object, which in this case, would be the database results
  // that were mapped to the Item fields
  async owner (item) {
    // returns an object that matches a User type (that we need to define)
    return await getUser(item.ownerId)
  }
}

export default itemResolvers
```

```javascript
// schema/user/user.type.js

const userType = `
  type User {
    # User identifier
    id: ID!
    # The user's username
    username: String!
  }
`

export default userType
```

- The `getUser(item.ownerId)` implementation would be a database call to fetch the user; the returned data 
should map to the `User` type fields
- GraphQL now has the data for item name and owner's username and returns the result to the client

### Resolver Summary

- Object lookups start at the root, in this case the `RootQuery` type was defined with an `item` field
- The `RootQuery#item()` resolver returned an object that mapped to most fields of the `Item` type, but we were lacking the `Item.owner` data
- To get the `Item.owner` data, GraphQL called the `Item#owner()` resolver, which did a fetch to get the user data
- The results from `Item#owner()` is attached to the `Item.owner` field
- We now have the item's name and the owner username, so GraphQL returns just those pieces to the client

## Putting the Schema + Resolvers Together

We combine our resolvers into a single package

```javascript
// schema/resolvers.js

import User from './user/user.resolvers'
import Item from './item/item.resolvers'
import RootQuery from './root-query/root-query.resolvers'

export default {
  User,
  Item,
  RootQuery
}
```

Our entire schema is built here

```javascript
// schema/schema.js

import UserType from './user/user.type'
import ItemType from './item/item.type'

import RootQuery from './root-query/root-query.type'
import resolvers from './resolvers'

import { makeExecutableSchema } from 'graphql-tools'

// the schema type only has two properties: query and mutations
// the RootQuery contains the root entry points into graphQL
// If you want to define more entry points, you add to RootQuery
const SchemaDefinition = `
  schema {
    query: RootQuery
  }
`

const schema = makeExecutableSchema({
  // Add the type definitions to the schema
  typeDefs: [
    SchemaDefinition,
    RootQuery,
    UserType,
    ItemType
  ],
  // performs field lookups for a specific type
  resolvers
})

export default schema
```

Now hook up the schema

```javascript
// app.js

import express from 'express'
import cors from 'cors'
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express'
import bodyParser from 'body-parser'

import schema from './schema/schema.js'

// GraphQL Schema is imported here
const graphQLSchema = schema

...
```

# Client-side Development

https://www.learnapollo.com/tutorial-react/react-01

Goal: Implement some really basic stuff to test the server implementation. Also understand what dev is like using the Apollo client.

This does not cover:

- How to break up your GraphQL queries into fragments
- How to perform mutations on your data (they're barely any different than defining calling a query)

## Required libraries

- react
- react-dom
- apollo-client
- react-apollo
- prop-types
- graphql-tag
- react-router-dom

## Directory structure

This structure is really bare-bones and has no rhyme or reason to it, it was just made to get off the ground running quickly to understand the client implementation.

```
├── queries/
│   └── item.queries.js
├── components/
│   └── ItemList.jsx
├── index.js
└── package.json
```

## Apollo Client + Routing setup

```javascript
// index.js

import React from 'react'
import ReactDOM from 'react-dom'

// The ApolloClient allows you to call the GraphQL API server
// and parses responses
import ApolloClient, { createNetworkInterface } from 'apollo-client'

// The ApolloProvider uses redux underneath the hood
// and provides data connections to your components
import { ApolloProvider } from 'react-apollo'

import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'

import ItemList from './components/ItemList.jsx'

const client = new ApolloClient({
  // replace the uri with your server's host/port
  networkInterface: createNetworkInterface({ uri: 'http://localhost:3000/graphql'}),
})

ReactDOM.render((
    <ApolloProvider client={client}>
      <Router>
        <div>
          <Route exact path='/' component={ItemList} />
        </div>
      </Router>
    </ApolloProvider>
  ),
  document.getElementById('root')
)
```

## Define queries

```javascript
// queries/item.queries.js

import gql from 'graphql-tag'

export default {
  // this is a feature called template tags
  // https://developers.google.com/web/updates/2015/01/ES6-Template-Strings#tagged_templates
  getItemList: gql`query ItemListQuery {
      items {
        id
        name,
        owner {
          username
        }
      }
    }`
  }
}

```

## `ItemList` component

```javascript
// components/ItemList.jsx
import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'react-apollo'
import { Link } from 'react-router-dom'
import { getItemList } from '../queries/item.queries.js'

class ItemList extends React.Component {
  render () {
    const {
      data
    } = this.props
  
    if (data.loading) {
      return (<div>Loading</div>)
    }

    if (data.error) {
      console.log(data.error)
      return (<div>An unexpected error occurred</div>)
    }

    return (
      <div>
        <ul>
        {data.items.map((item) => {
          return (
            <li key={item.id}>
              {item.id} - {item.name} - {item.owner.username}
            </li>
          )
        })}
        </ul>
      </div>
    )
  }
}

ItemList.propTypes = {
  // This structure is Apollo-specific
  // the prop starts with a data root key
  // and contains loading, error, and your graphql root fields
  // that you're interested in pulling
  // see: https://www.learnapollo.com/tutorial-react/react-02#Displaying[object Object]information[object Object]of[object Object]your[object Object]trainer
  // under "Using query results in React components"

  data: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.object,
    // This corresponds with the 'items' field in the 'ItemListQuery'
    items: PropTypes.arrayOf(PropTypes.object),
  }).isRequired
}

// wrap the graphql (Apollo) store around the component
// and call the getItemList query when there is a need to fetch data
const ItemListView = graphql(getItemList)(ItemList)

export default ItemListView
```

# Add-ons

The Apollo Developer Chrome extension is very useful. Gives you the view of the underlying redux store state, and you can also try queries as well.

https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm?hl=en-US

# Mutations

Mutations involves updating data. The following will describe how to implement mutations

## Define Server-side mutation

Implementing a mutation entrypoint is just like defining a normal query entrypoint:

### Define the `RootMutation` type entrypoint definitions

```javascript
// schema/root-mutation/root-mutation.type.js

const RootMutation = `
  type RootMutation {
    addItem (
      name: String!,
      desc: String,
      ownerId: ID!
    ): Item
  }
`
export default RootMutation

```

*Just like the `RootQuery`, you can change the name of the `RootMutation` type to whatever you want.*

### Define the `RootMutation` resolver

Defining the resolver is just like any other resolver.

```javascript
// schema/root-mutation/root-mutation.resolvers.js

const rootMutationResolvers = {
  async addCapsule (rootObj, { name, desc, ownerId }) {
    return await addItem({ name, desc, ownerId })
  }
}

export default rootMutationResolvers
```

### Add the `RootMutation` resolver to the master resolvers

```
// schema/resolvers.js

// I'm not including the other imports for clarity
import RootMutation from './root-mutation/root-mutation.resolvers.js'

export default {
  User,
  Item,
  RootQuery,
  // New addition here
  RootMutation
}
```

### Register the `RootMutation` type to the schema

```
// schema/schema.js

// not including the other imports here for clarity
import RootMutation from './root-mutation/root-mutation.type.js'

// attach the RootMutation as a mutation
// only ONE root query and mutation can be defined
const SchemaDefinition = `
  schema {
    query: RootQuery,
    mutation: RootMutation
  }
`

const schema = makeExecutableSchema({
  typeDefs: [
    SchemaDefinition,
    RootQuery,
    // New addition here, can be added in any position in this array
    RootMutation,
    UserType,
    CapsuleType
  ],
  resolvers
})

```

