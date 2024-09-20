import { useState } from 'react';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/FormLabel';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { debounce } from '@mui/material/utils';

import stationsDataJson from './data/stations.json';

if (stationsDataJson?.length <= 1) {
  console.warn('Stations data needs to be generated using "npm run generate-data"!');
}

interface StationOption {
  id: string,
  name: string,
}

const stationsData: StationOption[] = stationsDataJson;

function StationSelect({ id, label, setValue = () => {} }: { id: string, label: string, setValue?: (newValue: string | null) => void }) {
  const [options, setOptions] = useState<StationOption[]>([]);

  const buildOptions = (searchTerm: string): StationOption[] => {
    const diatrictsRegex = /[\u0300-\u036f]/g;

    const searchTermList = searchTerm.split(' ');
    const searchRegexList = searchTermList.map((item) => (
      item.trim() ? new RegExp(item.trim(), 'i') : null
    )).filter((item) => (item));

    const stationOptions = stationsData.filter((station) => {
      const stationNameNormalised = station.name.normalize('NFD').replace(diatrictsRegex, '');

      return searchRegexList.every((searchRegex) => (
        searchRegex && stationNameNormalised.match(searchRegex)
      ));
    });

    return stationOptions;
  };

  const onInputChange = (_: unknown, value: string) => {
    if (!value || value.length < 3) {
      setOptions([]);
      return;
    }

    const newOptions = buildOptions(value);
    setOptions(newOptions);
  };

  return (
    <FormControl fullWidth>

      <InputLabel htmlFor={id}>{label}</InputLabel>

      <Autocomplete
        options={options}
        onInputChange={debounce(onInputChange, 100)}
        filterOptions={(x) => x}
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
