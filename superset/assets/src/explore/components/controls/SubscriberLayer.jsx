/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { t } from '@superset-ui/translation';
import SelectControl from './SelectControl';
import PopoverSection from '../../../components/PopoverSection';
import TextControl from './TextControl';
import { nonEmpty } from '../../validators';

const propTypes = {
  name: PropTypes.string,
  operatorType: PropTypes.string,
  columnType: PropTypes.string,
  sliceType: PropTypes.number,
  width: PropTypes.number,
  subscriptionList: PropTypes.arrayOf(PropTypes.object),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  overrides: PropTypes.object,
  subscribe_columns: PropTypes.arrayOf(PropTypes.object),
  vizType: PropTypes.string,
  sliceOptions: PropTypes.arrayOf(PropTypes.object),
  error: PropTypes.string,
  addSubscriberLayer: PropTypes.func,
  removeSubscriberLayer: PropTypes.func,
  close: PropTypes.func,
  extraValue: PropTypes.string,
  allowMoreColumns: PropTypes.bool,
  allowColumnSelection: PropTypes.bool,
};

const defaultProps = {
  name: '',
  operatorType: '',
  columnType: '',
  overrides: {},
  sliceType: '',
  subscriptionList: [],
  subscribe_columns: [],
  timeColumn: '',
  extraValue: '',
  allowMoreColumns: false,
  allowColumnSelection: false,

  addSubscriberLayer: () => { },
  removeSubscriberLayer: () => { },
  close: () => { },
};

export default class SubscriberLayer extends React.PureComponent {
  constructor(props) {
    super(props);
    const {
      name,
      value,
      operatorType,
      columnType,
      sliceType,
      overrides,
      subscribe_columns,
      sliceOptions,
      subscriptionList,
      extraValue,
      allowMoreColumns,
      allowColumnSelection,
    } = props;

    this.state = {
      // base
      name,
      oldName: !this.props.name ? null : name,
      columnType,
      operatorType,
      columnType,
      sliceType,
      value,
      overrides,
      subscriptionList,
      extraValue,
      allowMoreColumns,
      allowColumnSelection,
      subscribe_columns,
      isNew: !this.props.name,
      isLoadingOptions: true,
      validationErrors: {},
    };

    this.state.subscriptionList = this.state.isNew ? [{ columnType: '', operatorType: '', index: 0 }] : this.state.subscriptionList;

    this.handleSliceType = this.handleSliceType.bind(this);
    this.submitSubscription = this.submitSubscription.bind(this);
    this.deleteSubscriber = this.deleteSubscriber.bind(this);
    this.applySubscription = this.applySubscription.bind(this);
    this.handleColumnType = this.handleColumnType.bind(this);
    this.handleOperatorType = this.handleOperatorType.bind(this);
    this.isValidForm = this.isValidForm.bind(this);
    this.addMoreColumns = this.addMoreColumns.bind(this);
    this.getSupportedOperators = this.getSupportedOperators.bind(this);
    this.getPublisedColumns = this.getPublisedColumns.bind(this);
    this.getPublishedSlices = this.getPublishedSlices.bind(this);
  }

  getSupportedOperators() {
    return [
      { label: 'equals', value: '==' },
      { label: 'not equal to', value: '!=' },
      { label: '>', value: '>' },
      { label: '<', value: '<' },
      { label: '>=', value: '>=' },
      { label: '<=', value: '<=' },
      { label: 'in', value: 'in' },
      { label: 'not in', value: 'not in' },
      { label: 'like', value: 'like' },
      { label: 'IS NOT NULL', value: 'IS NOT NULL' },
      { label: 'IS NULL', value: 'IS NULL' }];
  }

  getPublishedSlices() {
    return this.props.sliceOptions;
  }

  getPublisedColumns() {
    return [];
  }

  isValidForm() {
    const { sliceType, name } = this.state;
    const errors = [nonEmpty(sliceType), nonEmpty(name)];
    this.state.subscribe_columns ? errors.push(!this.state.subscribe_columns.length) : '';

    return !errors.filter(x => x).length;
  }

  handleSliceType(sliceType) {
    this.setState({
      sliceType,
      allowColumnSelection: true,
    });
  }

  handleColumnType(columnType, index) {
    const subscriptionList = this.state.subscriptionList;
    subscriptionList[index]['columnType'] = columnType;

    let subscribe_columns = this.state.subscribe_columns;
    subscribe_columns.length <= index ? subscribe_columns.push({}) : subscribe_columns;
    subscribe_columns[index]['col'] = columnType;

    this.setState({
      columnType,
      subscriptionList,
      subscribe_columns,
      allowMoreColumns: subscribe_columns[index]['col'] && subscribe_columns[index]['op'] ? true : false,
    });
  }

  handleOperatorType(operatorType, index) {
    let subscriptionList = this.state.subscriptionList;
    subscriptionList[index]['operatorType'] = operatorType;

    let subscribe_columns = this.state.subscribe_columns;
    subscribe_columns.length <= index ? subscribe_columns.push({}) : subscribe_columns;
    subscribe_columns[index]['op'] = operatorType;

    this.setState({
      operatorType,
      subscriptionList,
      subscribe_columns,
      allowMoreColumns: subscribe_columns[index]['col'] && subscribe_columns[index]['op'] ? true : false,
    });
  }

  addMoreColumns() {
    const subscriptionList = this.state.subscriptionList;
    const data = subscriptionList[subscriptionList.length - 1];
    const newData = { columnType: '', operatorType: '', index: data.index + 1 }
    this.setState(prevState => ({ subscriptionList: [...prevState.subscriptionList, newData] }))
  }

  removeColumn(e, column) {
    this.setState(prevState => ({ subscriptionList: [...prevState.subscriptionList.filter(x => x.index !== column.index)] }))
  }

  deleteSubscriber() {
    this.props.close();
    if (!this.state.isNew) {
      this.props.removeSubscriberLayer(this.state);
    }
  }

  applySubscription() {
    if (this.state.name.length && this.state.sliceType) {
      const subscription = {};

      Object.keys(this.state).forEach((k) => {
        if (this.state[k] !== null) {
          subscription[k] = this.state[k];
        }
      });

      subscription['actions'] = [
        "APPLY_FILTER"
      ];

      subscription['linked_slice'] = [
        {
          publisher_id: this.state.sliceType,
          subscribe_columns: this.state.subscribe_columns,
        }
      ];

      subscription['extras'] = this.state.extraValue;

      this.props.addSubscriberLayer(subscription);
      this.setState({ isNew: false, oldName: this.state.name });
    }
  }

  submitSubscription() {
    this.applySubscription();
    this.props.close();
  }

  renderSingleSubscription(subscriptionData) {
    const { columnType, operatorType, index } = subscriptionData;
    const { allowColumnSelection, } = this.state;

    const operators = this.getSupportedOperators();
    const columns = this.getPublisedColumns();

    return (
      <div key={index} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '400px' }}>

        <TextControl
          name="extra-subscription-layer"
          label={t('Column')}
          disabled={!allowColumnSelection}
          description={'Set column (If any)'}
          value={columnType}
          onChange={(e) => this.handleColumnType(e, index)}
        />

        <SelectControl
          hovered
          description="Choose the Operator"
          disabled={!allowColumnSelection}
          label="Select Operator"
          name="operator-source-type"
          options={operators}
          value={operatorType}
          onChange={(e) => this.handleOperatorType(e, index)}
        />

        <Button title="Remove subscription columns and operators" bsSize="sm" disabled={index === 0} style={{ height: '30px', marginTop: '25px' }} onClick={(e) => this.removeColumn(e, subscriptionData)}>
          {'-'}
        </Button>

      </div>
    );
  }

  render() {
    const { isNew, columnType, operatorType, sliceType, extraValue, allowMoreColumns, name } = this.state;
    const isValid = this.isValidForm();

    const publishedSlices = this.getPublishedSlices();

    return (
      <div>
        {this.props.error && <span style={{ color: 'red' }}>ERROR: {this.props.error}</span>}
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ marginRight: '2rem' }}>
            <PopoverSection
              isSelected
              onSelect={() => { }}
              title={t('Subscription Configuration')}
              info={t('Configure Subscription')}
            >
              <TextControl
                name="subscriber-layer-name"
                label={t('Name')}
                placeholder=""
                value={name}
                onChange={v => this.setState({ name: v })}
                validationErrors={!name ? [t('Mandatory')] : []}
              />
              <SelectControl
                hovered
                description={t('Choose the Chart to subscribe')}
                label={t('Select Chart')}
                name="publised-layer-name"
                options={publishedSlices}
                value={sliceType}
                onChange={this.handleSliceType}
              />

              {this.state.subscriptionList.map(subscription => {

                return (
                  this.renderSingleSubscription(subscription)
                )
              })
              }

              <Button title="Add subscription columns and operators" bsSize="sm" disabled={!allowMoreColumns} onClick={this.addMoreColumns}>
                {'+'}
              </Button>
              {/* <TextControl
                name="extra-subscription-layer"
                label={t('Extra')}
                description={'Set Extra parameters (If any)'}
                value={extraValue}
                onChange={v => this.setState({ extraValue: v })}
              /> */}

            </PopoverSection>
          </div>

        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button bsSize="sm" onClick={this.deleteSubscriber}>
            {!isNew ? t('Remove') : t('Cancel')}
          </Button>
          <div>
            <Button bsSize="sm" disabled={!isValid} onClick={this.submitSubscription}>
              {t('OK')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

SubscriberLayer.propTypes = propTypes;
SubscriberLayer.defaultProps = defaultProps;
