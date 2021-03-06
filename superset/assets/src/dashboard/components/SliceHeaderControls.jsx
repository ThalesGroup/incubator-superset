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
import moment from 'moment';
import { Dropdown, MenuItem } from 'react-bootstrap';
import { t } from '@superset-ui/translation';

import {
  Logger,
  LOG_ACTIONS_EXPLORE_DASHBOARD_CHART,
  LOG_ACTIONS_EXPORT_CSV_DASHBOARD_CHART,
  LOG_ACTIONS_REFRESH_CHART,
} from '../../logger';

import { APPLICATION_PREFIX } from "../../public-path";

const propTypes = {
  slice: PropTypes.object.isRequired,
  isCached: PropTypes.bool,
  isExpanded: PropTypes.bool,
  cachedDttm: PropTypes.string,
  updatedDttm: PropTypes.number,
  supersetCanExplore: PropTypes.bool,
  sliceCanEdit: PropTypes.bool,
  toggleExpandSlice: PropTypes.func,
  forceRefresh: PropTypes.func,
  executeRestAction: PropTypes.func,
  exploreChart: PropTypes.func,
  exportCSV: PropTypes.func,
  canExportCSV: PropTypes.bool,
};

const defaultProps = {
  executeRestAction: () => ({}),
  forceRefresh: () => ({}),
  toggleExpandSlice: () => ({}),
  exploreChart: () => ({}),
  exportCSV: () => ({}),
  cachedDttm: null,
  updatedDttm: null,
  isCached: false,
  isExpanded: false,
  supersetCanExplore: false,
  canExportCSV: true,
  sliceCanEdit: false,
};

const VerticalDotsTrigger = () => (
  <div className="vertical-dots-container">
    <span className="dot" />
    <span className="dot" />
    <span className="dot" />
  </div>
);

class SliceHeaderControls extends React.PureComponent {
  constructor(props) {
    super(props);
    this.exportCSV = this.exportCSV.bind(this);
    this.exploreChart = this.exploreChart.bind(this);
    this.toggleControls = this.toggleControls.bind(this);
    this.refreshChart = this.refreshChart.bind(this);
    this.toggleExpandSlice = this.props.toggleExpandSlice.bind(
      this,
      this.props.slice.slice_id,
    );
    this.restActions = this.props.slice.form_data.rest_actions || [];
    const navigate_action = this.getNavigateToDashboardAction();
    const raise_ticket_action = this.getRaiseTicketAction();
    if(navigate_action) this.restActions.push(navigate_action);
    if(raise_ticket_action) this.restActions.push(raise_ticket_action);

    this.renderRestActions = this.renderRestActions.bind(this);
    this.executeRestAction = this.props.executeRestAction.bind(this);
    this.state = {
      showControls: false,
    };
  }

  getNavigateToDashboardAction() {
    if (this.props.slice.form_data.navigate_to_dashboards && this.props.slice.form_data.navigate_to_dash_link_name) {
      let navigateToDashURL = APPLICATION_PREFIX + "/superset/dashboard/" + this.props.slice.form_data.navigate_to_dashboards + "/";
      let navigateToDashAction = {
        "label": this.props.slice.form_data.navigate_to_dash_link_name,
        "url": navigateToDashURL,
        "method": "GET"
      };
      if (this.props.slice.form_data.hasOwnProperty('passing_filter_to_dasboard')) {
        navigateToDashAction['passFilters'] = this.props.slice.form_data.passing_filter_to_dasboard;
      }
      return navigateToDashAction;
    }
  }

  getRaiseTicketAction() {
    let raise_ticket_action
    if(this.props.conf['TICKET_GENERATION_SYSTEM_ENDPOINT'] != '') {
      const raise_ticket_payload = this.props.slice.form_data.raise_ticket_action_payload
      if (this.props.slice.form_data.raise_ticket_action) {
        raise_ticket_action = {
          "label": "Raise Ticket",
          "url": "TICKET_GENERATION_SYSTEM_ENDPOINT",
          "method": "POST",
          "data": JSON.parse(raise_ticket_payload),
          "success_message": this.props.slice.form_data.raise_ticket_action_message,
        };
    }
    return raise_ticket_action
    }
  }

  exportCSV() {
    this.props.exportCSV(this.props.slice.slice_id);
    Logger.append(
      LOG_ACTIONS_EXPORT_CSV_DASHBOARD_CHART,
      {
        slice_id: this.props.slice.slice_id,
        is_cached: this.props.isCached,
      },
      true,
    );
  }

  exploreChart() {
    this.props.exploreChart(this.props.slice.slice_id);
    Logger.append(
      LOG_ACTIONS_EXPLORE_DASHBOARD_CHART,
      {
        slice_id: this.props.slice.slice_id,
        is_cached: this.props.isCached,
      },
      true,
    );
  }

  refreshChart() {
    if (this.props.updatedDttm) {
      this.props.forceRefresh(this.props.slice.slice_id);
      Logger.append(LOG_ACTIONS_REFRESH_CHART, {
        slice_id: this.props.slice.slice_id,
        is_cached: this.props.isCached,
      });
    }
  }

  toggleControls() {
    this.setState({
      showControls: !this.state.showControls,
    });
  }

  getClass() {
    return this.props.canExportCSV ? "export-csv-enabled" : "export-csv-disabled";
  }

  renderRestActions() {
    const actionItems = []
    for (const restAction of  this.restActions) {
      actionItems.push(<MenuItem key={restAction.label} eventKey={restAction} onSelect={this.executeRestAction}>
          {restAction.label}
      </MenuItem>);
    }
    return actionItems;
  }


  render() {
    const { slice, isCached, cachedDttm, updatedDttm, conf } = this.props;
    const cachedWhen = moment.utc(cachedDttm).fromNow();
    const updatedWhen = updatedDttm ? moment.utc(updatedDttm).fromNow() : '';
    const refreshTooltip = isCached
      ? t('Cached %s', cachedWhen)
      : (updatedWhen && t('Fetched %s', updatedWhen)) || '';

    return (
      <Dropdown
        id={`slice_${slice.slice_id}-controls`}
        pullRight
        // react-bootstrap handles visibility, but call toggle to force a re-render
        // and update the fetched/cached timestamps
        onToggle={this.toggleControls}
      >
        <Dropdown.Toggle className="slice-header-controls-trigger" noCaret>
          <VerticalDotsTrigger />
        </Dropdown.Toggle>

        <Dropdown.Menu className="slice-header-dropdown-menu">
          <MenuItem className={this.getClass()} onClick={this.refreshChart}>
            {t('Force refresh')}
            <div className="refresh-tooltip">{refreshTooltip}</div>
          </MenuItem>

          <MenuItem divider />

          {slice.description && (
            <MenuItem onClick={this.toggleExpandSlice}>
              {t('Toggle chart description')}
            </MenuItem>
          )}

          {this.props.sliceCanEdit && (
            <MenuItem href={slice.edit_url} target="_blank">
              {t('Edit chart metadata')}
            </MenuItem>
          )}

          <MenuItem className={this.getClass()} onClick={this.exportCSV}>{t('Export CSV')}</MenuItem>

          {this.props.supersetCanExplore && (
            <MenuItem onClick={this.exploreChart}>
              {t('Explore chart')}
            </MenuItem>
          )}
          {this.renderRestActions()}
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}

SliceHeaderControls.propTypes = propTypes;
SliceHeaderControls.defaultProps = defaultProps;

export default SliceHeaderControls;
