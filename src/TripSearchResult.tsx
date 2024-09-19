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

import { hafasCallTripSearch, Trip } from './libs/hafas';
import { formatDateTime } from './libs/format';

function TripSearchResult({ fromStation = null, toStation = null }: { fromStation?: string | null, toStation?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>();

  useEffect(() => {
    async function doTripSearchCall() {
      if (!fromStation || !toStation) {
        return;
      }
      console.log(`fromStation="${fromStation}" toStation="${toStation}"`);

      setLoading(true);
      setTrips([]);

      const tripSearchResult = await hafasCallTripSearch(fromStation, toStation);
      console.log(tripSearchResult);
      setLoading(false);
      if (tripSearchResult) {
        setTrips(tripSearchResult.trips);
      }
    }

    void doTripSearchCall();
  }, [fromStation, toStation]);

  if (!fromStation || !toStation) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>

        <TableHead>
          <TableRow>
            <TableCell>Depart</TableCell>
            <TableCell>Arrive</TableCell>
            <TableCell align="right">Duration</TableCell>
            <TableCell align="right">Changes</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {trips?.map((trip) => (
            <TableRow
              key={trip.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">{trip?.depart ? formatDateTime(trip.depart) : '-'}</TableCell>
              <TableCell component="th" scope="row">{trip?.arrive ? formatDateTime(trip.arrive) : '-'}</TableCell>
              <TableCell align="right">{trip.duration}</TableCell>
              <TableCell align="right">{trip.changes}</TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>
    </TableContainer>
  );
}

export default TripSearchResult;
