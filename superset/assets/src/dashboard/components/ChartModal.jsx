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
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import ChartContainer from '../../chart/ChartContainer';
import { chartPropShape } from '../util/propShapes';
import { chart as initChart } from '../../chart/chartReducer';

const propTypes = {
  showModal: PropTypes.bool,
  animation: PropTypes.bool,
  modalTitle: PropTypes.node,
  modalBody: PropTypes.node,  // not required because it can be generated by beforeOpen
  close: PropTypes.func.isRequired,
  id: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,

  chart: PropTypes.shape(chartPropShape).isRequired,
  timeout: PropTypes.number,
  addFilter: PropTypes.func.isRequired,
  datasource: PropTypes.object.isRequired,
};
const BLANK = {};
var subHeaderForModalCharts = '';
const defaultProps = {
  width: 760,
  height: 460,
  animation: true,
  modalTitle: 'Details',
  showModal: false,
  addFilter: () => BLANK,
  close: () => BLANK,
  chart: {
    ...initChart,
  },
  datasource: {},
  timeout: 60,
};

export default class ChartModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.showModal != this.state.showModal) {
      return true;
    }
    if (nextProps.chart.chartStatus != this.props.chart.chartStatus) {
      return true;
    }

    return false;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.showModal != this.props.showModal)
      this.setState(() => ({ showModal: nextProps.showModal }));
  }

  render() {
    const {
      height,
      width,
      addFilter,
      datasource,
      chart,
      modalTitle,
      timeout,
      close
    } = this.props;

    return (
      <Modal
        animation={this.props.animation}
        show={this.state.showModal}
        onHide={close}
        onExit={close}
        backdrop="static"
        dialogClassName="chart-modal-style"
      >
        {modalTitle &&
          <Modal.Header closeButton>
            <Modal.Title>{modalTitle}</Modal.Title>
          </Modal.Header>
        }
        <Modal.Body>
          {this.props.showModal && chart && (
            <ChartContainer
              width={width}
              height={height}
              addFilter={addFilter}
              timeout={timeout}
              datasource={datasource}
              annotationData={chart.annotationData}
              chartAlert={chart.chartAlert}
              chartId={chart.id}
              chartStatus={chart.chartStatus}
              formData={chart.formData}
              queryResponse={chart.queryResponse}
              triggerQuery={chart.triggerQuery}
              vizType={chart.formData.viz_type}
            />
          )
          }
        </Modal.Body>
      </Modal>
    );
  }
}
ChartModal.propTypes = propTypes;
ChartModal.defaultProps = defaultProps;
