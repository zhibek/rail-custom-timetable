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
  hint: string,
}

const stationsData: StationOption[] = stationsDataJson;

const diatrictsRegex = /[\u0300-\u036f]/g;

const normaliseText = (text: string) => (
  text.normalize('NFD').replace(diatrictsRegex, '').toLowerCase()
);

function StationSelect({ id, label, setValue = () => {} }: { id: string, label: string, setValue?: (newValue: string | null) => void }) {
  const [options, setOptions] = useState<StationOption[]>([]);

  const buildOptions = (searchTerm: string): StationOption[] => {
    const searchTermList = searchTerm.split(' ')
      .map((searchItem) => (normaliseText(searchItem)));

    const stationOptions = stationsData.filter((station) => {
      const stationNameNormalised = normaliseText(station.name);
      const stationHintNormalised = normaliseText(station.hint);

      return searchTermList.every((searchItem) => (
        stationNameNormalised.includes(searchItem) || stationHintNormalised.includes(searchItem)
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
          <TextField {...params} id={id} variant="standard" placeholder="Select station..." />
        )}
        getOptionLabel={(station) => (station.name)}
        onChange={(_, station) => { setValue(station?.id ?? null); }}
      />

    </FormControl>
  );
}

export default StationSelect;
