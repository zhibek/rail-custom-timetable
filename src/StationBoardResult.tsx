import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { hafasCallStationBoard, Trip } from './libs/hafas';
import { formatDateTime } from './libs/format';

function StationBoardResult({ station = null }: { station?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>();

  useEffect(() => {
    async function doTripSearchCall() {
      if (!station) {
        return;
      }
      console.log(`station="${station}"`);

      setLoading(true);
      setTrips([]);

      const stationBoardResult = await hafasCallStationBoard(station);
      console.log(stationBoardResult);
      setLoading(false);
      if (stationBoardResult) {
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
    <TableContainer component={Paper}>
      <Table>

        <TableHead>
          <TableRow>
            <TableCell>Depart</TableCell>
            <TableCell align="right">Direction</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {trips?.map((trip) => (
            <TableRow
              key={trip.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">{trip?.depart ? formatDateTime(trip.depart) : '-'}</TableCell>
              <TableCell align="right">{trip.direction}</TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>
    </TableContainer>
  );
}

export default StationBoardResult;
