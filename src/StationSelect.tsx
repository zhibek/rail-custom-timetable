import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/FormLabel';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

import stationsData from './data/stations.json';

if (stationsData?.length <= 1) {
  console.warn('Stations data needs to be generated using "npm run generate-data"!');
}

function StationSelect({ id, label, setValue = () => {} }: { id: string, label: string, setValue?: (newValue: string | null) => void }) {
  return (
    <FormControl fullWidth>

      <InputLabel htmlFor={id}>{label}</InputLabel>

      <Autocomplete
        options={stationsData}
        renderInput={(params) => (
          <TextField {...params} id={id} variant="filled" placeholder="Select station..." />
        )}
        getOptionLabel={(station) => (station.name)}
        onChange={(_, station) => { setValue(station?.id ?? null); }}
      />

    </FormControl>
  );
}

export default StationSelect;
