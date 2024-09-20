import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { hafasCallStationBoard, Station, Trip } from './libs/hafas';
import { formatDateTime } from './libs/format';

function StationBoardResult({ station = null }: { station?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>();
  const [trips, setTrips] = useState<Trip[]>();
  const [tab, setTab] = useState(0);

  const changeTab = (_: unknown, newTab: number) => {
    setTab(newTab);
  };

  useEffect(() => {
    async function doTripSearchCall() {
      if (!station) {
        return;
      }
      console.log(`station="${station}"`);

      setLoading(true);
      setStations([]);
      setTrips([]);

      const stationBoardResult = await hafasCallStationBoard(station);
      console.log(stationBoardResult);
      setLoading(false);
      if (stationBoardResult) {
        setStations(stationBoardResult.stations);
        setTrips(stationBoardResult.trips);
      }
    }

    void doTripSearchCall();
  }, [station]);

  if (!station) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', marginTop: '50px' }}>
        <CircularProgress style={{ margin: 'auto' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={changeTab} centered>
          <Tab label="Connections" />
          <Tab label="Departures" />
        </Tabs>
      </Box>

      {(tab === 0) ? (
        <TableContainer component={Paper}>
          <Table>

            <TableHead>
              <TableRow>
                <TableCell>Station</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {stations?.map((stationItem) => (
                <TableRow
                  key={stationItem.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">{stationItem.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </TableContainer>
      ) : null}

      {(tab === 1) ? (
        <TableContainer component={Paper}>
          <Table>

            <TableHead>
              <TableRow>
                <TableCell>Depart</TableCell>
                <TableCell align="right">Direction</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {trips?.map((tripItem) => (
                <TableRow
                  key={tripItem.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">{tripItem?.depart ? formatDateTime(tripItem.depart) : '-'}</TableCell>
                  <TableCell align="right">{tripItem.direction}</TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </TableContainer>
      ) : null}
    </Box>
  );
}

export default StationBoardResult;
