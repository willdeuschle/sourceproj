import React, { Component } from 'react'
import { graphql } from 'react-apollo'
import update from 'immutability-helper'

import '../styles/SourceList.css'
import {
  sourceListQuery,
  sourceAddedSubscription,
} from './queries.js'
import { mutationTypes } from './mutations.js'
import { sourceListReducer } from './reducers.js'
import SourceItem from './SourceItem.js'


class SourceList extends React.Component {
  constructor() {
    super()
    this.renderSourceList = this.renderSourceList.bind(this)
    this.subscribe = this.subscribe.bind(this)
  }

  subscribe() {
    this.props.subscribeToMore({
      document: sourceAddedSubscription,
      variables: { user_id: this.props.userId },
      updateQuery: (previousResult, { subscriptionData }) => {
        console.log("in updateQueries", previousResult, subscriptionData)
        return update(previousResult, {
            sourceList: {
                sources: {
                    $unshift: [subscriptionData.data.sourceAdded],
                },
            },
        })
      }
    })
  }

  renderSourceList() {
    if (this.props.sourceList) {
      // message for if they don't have any sources
      if (this.props.sourceList.sources.length === 0) {
        return (
          <div className='no-sources'>
            You don't have any sources yet. Add them via the input box on the left or through our Chrome extension.
          </div>
        )
      }
      return this.props.sourceList.sources.map(
        (sourceItem) => (<SourceItem
            key={sourceItem.id}
            sourceItem={sourceItem}
          />)
      )
    }
  }

  // this is a temporary measure while there is still a bug with how apollo
  // handles updating queries. we are going to store the value of the
  // current SourceList, and if it changes, we need to refetch data to ensure
  // that we have all of the latest sources
  componentDidMount() {
    this._currentSourceListId = this.props.sourceListId
    this.subscribe()
  }

  // this is the second part of the temporary measure described above
  componentWillReceiveProps(newProps) {
    // if the sourceListId has changed, reassign that value and
    // refetch the data
    if (this._currentSourceListId !== newProps.sourceListId) {
      this._currentSourceListId = newProps.sourceListId
      this.props.refetch()
    }
  }

  render() {
    return (
      <div className='SourceList'>
        {this.renderSourceList()}
      </div>
    )
  }
}

// the variables we want to use with the query
const options = (ownProps) => {
  return {
    // we need this reducer for when we add, delete, or update sources
    reducer: sourceListReducer,
    variables: {
      userId: ownProps.userId,
      sourceListId: ownProps.sourceListId,
    },
  }
}

// potentially rename our props in the future
const props = ({ ownProps, data: { sourceList, loading, refetch, subscribeToMore }}) => ({
  sourceList,
  loading,
  refetch,
  subscribeToMore,
})
//const props = ({ ownProps, data}) => {
  //console.log("what have before", ownProps, data)
  //return {
    //sourceList: data.sourceList,
    //loading: data.loading,
    //refetch: data.refetch,
  //}
//}

// export the 'connected' component
export default graphql(sourceListQuery, {
  options,
  props,
})(SourceList)
