import React from 'react';
import ReactHighcharts from 'react-highcharts';
import useInterval from './useInterval';
import moment from 'moment';
import { API_URL, DEVICE_ID, TZ_OFFSET, ELEVATION, LATITUDE, EVA_COEF } from './const';
import './App.css';

const DATE_FORMAT = 'YYYY-MM-DD';

function App() {
  const [delay, setDelay] = React.useState(2500);
  const [limit, setLimit] = React.useState(7);

  const [data, setData] = React.useState({
    duration: 0,
    temps: [],
    evapos: [],
    solars: [],
    dates: [],
  });

  const [elevation, setElevation] = React.useState(ELEVATION);
  const [coef, setCoef] = React.useState(EVA_COEF);

  const addNewData = React.useCallback((data, item) => {
    const newData = [...data];
    newData.push(item);
    if(newData.length > limit) {
      newData.shift();
    }

    return newData;
  }, [limit]);

  useInterval(() => {
    (async () => {
      try {
        const date = moment(moment("2019-01-01"), DATE_FORMAT).add(data.duration, 'days').format(DATE_FORMAT);
        const day = moment(date).format("MMM Do");

        let url = `${API_URL}/${DEVICE_ID}?date=${date}&tzOffset=${TZ_OFFSET}&elevation=${elevation}&latitude=${LATITUDE}&Kc=${coef}`;

        const response = await fetch(url);
        const json = await response.json();

        const { meanDailyAirTemperatureC, meanSolarRadiationMJ, avgWindSpeedMs, atmosphericPressue, netRadiation, evapotranspirationMM, evapotranspirationIN} = json;

        setData({
          duration: data.duration + 1,
          temps: addNewData(data.temps, [
            day,
            meanDailyAirTemperatureC
          ]),

          solars: addNewData(data.solars, [
            day,
            atmosphericPressue
          ]),

          evapos: addNewData(data.evapos, [
            day,
            evapotranspirationIN
          ]),

          dates: addNewData(data.dates, day)
        });

      } catch(ex) {
        console.log('Error during fetching data from api', ex); 
      }
    })();
  }, delay);

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <ReactHighcharts
            isPureConfig
            config={{
              rangeSelector: {
                selected: 1
              },
              title: {
                text: 'Evapo Live Chart.'
              },
              subtitle: {
                text: 'data from Jan 01, 2019'
              },
              xAxis: [{
                categories: data.dates,
                crosshair: true,
              }],
              yAxis: [
                { // Primary yAxis
                  title: {
                    text: 'Values',
                  },

                  labels: {
                    format: '{value}'
                  },
                  opposite: true
                },
                { // Secondary yAxis
                  labels: {
                    format: '{value} in',
                  },
                  title: {
                    text: 'Evapotranspiration',
                  },
                },
              ],
              series: [{
                name: 'Temperature (F)',
                data: data.temps,
                yAxis: 1,
                tooltip: {
                  valueDecimals: 2
                }
              },{
                name: 'Evapo (In)',
                data: data.evapos,
                yAxis: 0,
                tooltip: {
                  valueDecimals: 2
                }
              }, {
                name: 'Solar (MJ)',
                yAxis: 0,
                data: data.solars,
                tooltip: {
                  valueDecimals: 2
                }
              }]
            }}/>
        </div>

        <table>
          <tr>
            <th>Date</th>
            <th>Temps</th>
            <th>Evapo</th>
            <th>Solar</th>
          </tr>

          <tbody>
            {
              data.dates.map((date, i) => (
                <tr key={i}>
                  <td>{date}</td>
                  <td>{data.temps[i][1]}</td>
                  <td>{data.evapos[i][1]}</td>
                  <td>{data.solars[i][1]}</td>
                </tr>
              ))
            }
          </tbody>
        </table>

        <div className="tool">
            <label htmlFor="limit" className="label">Limit (days)</label>
            <input type="number" name="limit" value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10))}></input>

            <br />

            <label htmlFor="delay" className="label">Refresh duration (ms)</label>
            <input type="number" name="delay" value={delay} onChange={(e) => setDelay(parseInt(e.target.value, 10))} disabled></input>
        </div>
      </header>
    </div>
  );
}

export default App;
