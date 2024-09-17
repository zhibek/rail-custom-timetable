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

import { hafasCall, Journey } from './libs/hafas';
import { formatDateTime } from './libs/format';

function JourneyResults({ fromStation = null, toStation = null }: { fromStation?: string | null, toStation?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [journeys, setJourneys] = useState<Journey[]>();

  useEffect(() => {
    async function doHafasCall() {
      if (!fromStation || !toStation) {
        return;
      }
      console.log(`fromStation="${fromStation}" toStation="${toStation}"`);

      setLoading(true);
      setJourneys([]);

      const newJourneys = await hafasCall(fromStation, toStation);
      console.log(newJourneys);
      setLoading(false);
      if (newJourneys) {
        setJourneys(newJourneys.journeys);
      }
    }

    void doHafasCall();
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
          {(journeys)?.map((journey) => (
            <TableRow
              key={journey.index}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">{formatDateTime(journey.depart)}</TableCell>
              <TableCell component="th" scope="row">{formatDateTime(journey.arrive)}</TableCell>
              <TableCell align="right">{journey.duration}</TableCell>
              <TableCell align="right">{journey.changes}</TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>
    </TableContainer>
  );
}

export default JourneyResults;
