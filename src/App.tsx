import { useState } from 'react';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

import LayoutFrame from './LayoutFrame';
import TripSearch from './TripSearch';
import StationBoard from './StationBoard';

function App() {
  const [tab, setTab] = useState(0);

  const handleChange = (_: unknown, newTab: number) => {
    setTab(newTab);
  };

  return (
    <LayoutFrame>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={handleChange}>
          <Tab label="Trip Search" />
          <Tab label="Station Board" />
        </Tabs>
      </Box>

      {(tab === 0) ? <TripSearch /> : null}

      {(tab === 1) ? <StationBoard /> : null}

    </LayoutFrame>
  );
}

export default App;
