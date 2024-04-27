import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import Modal from 'react-modal';
import { saveAs } from 'file-saver';

Modal.setAppElement('#root');

const Dropdown = () => {
  const [data, setData] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [savedData, setSavedData] = useState({ stops: [] });
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetch('https://telematics.oasa.gr/api/?act=webGetLinesWithMLInfo')
      .then(response => response.json())
      .then(data => setData(data));
  }, []);

  useEffect(() => {
    if (selectedOption) {
      fetch(`https://telematics.oasa.gr/api/?act=webGetRoutes&p1=${selectedOption.value}`)
        .then(response => response.json())
        .then(data => setRoutes(data));
    } else {
      setRoutes([]);
    }
  }, [selectedOption]);

  useEffect(() => {
    if (selectedRoute) {
      fetch(`https://telematics.oasa.gr/api/?act=webGetStops&p1=${selectedRoute.value}`)
        .then(response => response.json())
        .then(data => setStops(data));
    } else {
      setStops([]);
    }
  }, [selectedRoute]);

  const options = data.map(item => ({
    value: item.line_code,
    label: `${item.line_id} - ${item.line_descr}`
  }));

  const routeOptions = routes.map(item => ({
    value: item.RouteCode,
    label: item.RouteDescr
  }));

  const stopOptions = stops.map(item => ({
    value: item.StopCode,
    label: item.StopDescr
  }));

  const handleLineChange = selectedOption => {
    setSelectedOption(selectedOption);
    console.log(`Line selected:`, selectedOption);
  };

  const handleRouteChange = selectedRoute => {
    setSelectedRoute(selectedRoute);
    console.log(`Route selected:`, selectedRoute);
  };

  const handleStopChange = selectedStop => {
    setSelectedStop(selectedStop);
    console.log(`Stop selected:`, selectedStop);
  };

  const handleSave = () => {
    if (!selectedOption || !selectedRoute || !selectedStop) {
      return;
    }
    setSavedData(prevData => {
      const stops = [...prevData.stops];
      const index = stops.findIndex(stop => Object.keys(stop)[0] === selectedStop.value);
      if (index !== -1) {
        if (!stops[index][selectedStop.value].includes(selectedOption.value)) {
          stops[index][selectedStop.value].push(selectedOption.value);
        }
      } else {
        stops.push({ [selectedStop.value]: [selectedOption.value] });
      }
      return { ...prevData, stops };
    });
    setSelectedOption(null);
    setSelectedRoute(null);
    setSelectedStop(null);
  };

  const handleDownload = () => {
    setModalIsOpen(true);
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
  };

  const handleModalSubmit = () => {
    const blob = new Blob([JSON.stringify({ ...savedData, SSID: ssid, PASSWORD: password, "setup": true }, null, 2)], { type: 'application/json' });
    saveAs(blob, 'data.json');
    setModalIsOpen(false);
  };

  return (
    <div className="app-container">
      <h1>OASA Realtime Config</h1>
      <h3>This code runs locally, the source code is <a href="https://github.com/ppdms/oasa-realtime-config/">here</a>.</h3>
      <Select
        value={selectedOption}
        onChange={handleLineChange}
        options={options}
        placeholder="Line"
      />
      <Select
        value={selectedRoute}
        onChange={handleRouteChange}
        options={routeOptions}
        placeholder="Route"
        isDisabled={!selectedOption}
      />
      <Select
        value={selectedStop}
        onChange={handleStopChange}
        options={stopOptions}
        placeholder="Stop"
        isDisabled={!selectedRoute}
      />
      <div id='buttons'>
        <button onClick={handleSave} disabled={!selectedOption || !selectedRoute || !selectedStop}>Save</button>
        <button onClick={handleDownload}>Download</button>
      </div>
      <ul>
        {savedData.stops.map((stop, index) => (
          <li key={index}>
            <strong>{Object.keys(stop)[0]}</strong>: {stop[Object.keys(stop)[0]]}
          </li>
        ))}
      </ul>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleModalClose}
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <h2>Enter SSID and Password</h2>
        <input type="text" value={ssid} onChange={e => setSsid(e.target.value)} placeholder="SSID" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button onClick={handleModalSubmit}>Submit</button>
      </Modal>
    </div>
  );
};

export default Dropdown;
